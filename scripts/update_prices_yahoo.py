"""
v1.38 - Popula Supabase com preço, histórico, proventos de 5 anos e
fundamentos básicos via Yahoo/yfinance.

Esta etapa melhora principalmente as ações comuns, como CMIG4, que precisam de:
- Indicadores-chave mais completos;
- Análise fundamentalista com Balanço, DRE e Fluxo de Caixa quando o Yahoo retornar;
- Dividendos e proventos exibíveis por até 5 anos.

Uso rápido, Camada 1:
    python scripts/update_prices_yahoo.py

Uso com tickers específicos:
    python scripts/update_prices_yahoo.py CMIG4 PETR4 ITUB4 MXRF11 HGLG11

Para a base ampliada, use:
    python scripts/update_base_inicial.py --all
"""

from __future__ import annotations

import os
import re
import sys
from datetime import datetime, timezone
from typing import Any

import pandas as pd
import requests
import yfinance as yf

from config import get_required_env, load_project_env
from supabase_rest import SupabaseConfig, SupabaseRestClient
from tickers import CORE_TICKERS, kind_for_ticker, yahoo_symbol
from ticker_aliases import resolve_current_ticker


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def today_iso() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def clean_number(value: Any) -> float | None:
    if value is None:
        return None

    try:
        if pd.isna(value):
            return None
    except TypeError:
        pass

    try:
        number = float(value)
    except (TypeError, ValueError):
        return None

    if number != number:
        return None

    return number


def clean_int(value: Any) -> int | None:
    number = clean_number(value)
    if number is None:
        return None

    return int(number)


BRAPI_BASE_URL = "https://brapi.dev/api"

def get_brapi_token() -> str | None:
    token = os.environ.get("BRAPI_API_TOKEN") or os.environ.get("BRAPI_TOKEN")
    return token.strip() if token and token.strip() else None

def _brapi_headers(token: str | None = None) -> dict[str, str]:
    headers = {"User-Agent": "MapaDoAtivoDataUpdater/1.53.27"}
    if token:
        # A BRAPI aceita token por query string em todos os planos. Mantemos
        # também o Bearer por compatibilidade, mas a query string é o caminho
        # mais estável nos runners do GitHub Actions.
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _brapi_params(params: dict[str, Any], token: str | None) -> dict[str, Any]:
    out = dict(params)
    if token:
        out["token"] = token
    return out


def _extract_brapi_results(payload: Any) -> list[dict[str, Any]]:
    if not isinstance(payload, dict):
        return []
    for key in ["results", "stocks", "data", "items", "quotes"]:
        value = payload.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
    return []


def fetch_brapi_classic_quote(ticker: str) -> dict[str, Any] | None:
    token = get_brapi_token()
    if not token:
        print({"warning": "brapi_token_missing", "ticker": ticker, "message": "BRAPI_API_TOKEN não configurado; fallback BRAPI ignorado."})
        return None

    normalized = ticker.upper().replace(".SA", "")
    endpoint_attempts = [
        (f"{BRAPI_BASE_URL}/quote/{normalized}", {"range": "10y", "interval": "1d", "fundamental": "true", "dividends": "true"}),
        (f"{BRAPI_BASE_URL}/v2/stocks/quote", {"symbols": normalized, "range": "10y", "interval": "1d", "fundamental": "true", "dividends": "true"}),
    ]

    for url, params in endpoint_attempts:
        try:
            response = requests.get(
                url,
                params=_brapi_params(params, token),
                headers=_brapi_headers(token),
                timeout=90,
            )
            if response.status_code >= 400:
                print({"warning": "brapi_quote_failed", "ticker": normalized, "status": response.status_code, "endpoint": url.replace(BRAPI_BASE_URL, "brapi"), "message": response.text[:300]})
                continue
            payload = response.json()
        except Exception as exc:
            print({"warning": "brapi_quote_exception", "ticker": normalized, "endpoint": url.replace(BRAPI_BASE_URL, "brapi"), "error": str(exc)})
            continue

        results = _extract_brapi_results(payload)
        if not results:
            print({"warning": "brapi_quote_empty", "ticker": normalized, "endpoint": url.replace(BRAPI_BASE_URL, "brapi")})
            continue

        for item in results:
            symbol = str(item.get("symbol") or item.get("stock") or item.get("ticker") or item.get("requestedSymbol") or "").upper().replace(".SA", "")
            if symbol == normalized:
                return item
        return results[0]

    return None

def normalize_brapi_date(value: Any) -> str | None:
    if value is None:
        return None
    try:
        if isinstance(value, (int, float)) and clean_number(value) is not None:
            numeric = float(value)
            timestamp = numeric if numeric > 10_000_000_000 else numeric * 1000
            return datetime.fromtimestamp(timestamp / 1000, tz=timezone.utc).date().isoformat()
        text = str(value).strip()
        if not text:
            return None
        if text.isdigit():
            numeric = float(text)
            timestamp = numeric if numeric > 10_000_000_000 else numeric * 1000
            return datetime.fromtimestamp(timestamp / 1000, tz=timezone.utc).date().isoformat()
        return pd.to_datetime(text, errors="coerce").date().isoformat()
    except Exception:
        return None

def brapi_history_rows(ticker: str, data: dict[str, Any]) -> list[dict[str, Any]]:
    raw = data.get("historicalDataPrice") or data.get("historical") or data.get("prices") or []
    if not isinstance(raw, list):
        return []

    rows: list[dict[str, Any]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        date = normalize_brapi_date(item.get("date") or item.get("formattedDate") or item.get("datetime"))
        close = clean_number(item.get("close") or item.get("adjClose") or item.get("price"))
        if not date or close is None:
            continue
        rows.append({
            "ticker": ticker,
            "date": date,
            "close": close,
            "volume": clean_int(item.get("volume")),
            "source": "brapi.dev",
            "updated_at": now_iso(),
        })

    unique: dict[str, dict[str, Any]] = {}
    for row in rows:
        unique[row["date"]] = row
    return [unique[key] for key in sorted(unique)]

def brapi_dividend_rows(ticker: str, data: dict[str, Any]) -> list[dict[str, Any]]:
    dividends_data = data.get("dividendsData") if isinstance(data.get("dividendsData"), dict) else {}
    raw = (dividends_data or {}).get("cashDividends") or data.get("cashDividends") or data.get("dividends") or []
    if not isinstance(raw, list):
        return []

    rows: list[dict[str, Any]] = []
    kind = kind_for_ticker(ticker)
    for item in raw:
        if not isinstance(item, dict):
            continue
        value = clean_number(item.get("rate") or item.get("value") or item.get("amount") or item.get("cash"))
        if value is None or value <= 0:
            continue
        payment_date = normalize_brapi_date(item.get("paymentDate") or item.get("datePayment") or item.get("payDate"))
        com_date = normalize_brapi_date(item.get("lastDatePrior") or item.get("comDate") or item.get("dateWith"))
        date = payment_date or com_date
        if not date:
            continue
        rows.append({
            "ticker": ticker,
            "type": "Rendimento" if kind == "fii" else "Dividendo",
            "value": value,
            "com_date": com_date,
            "payment_date": payment_date or date,
            "source": "brapi.dev",
            "updated_at": now_iso(),
        })
    return rows

def brapi_quote_row(ticker: str, data: dict[str, Any], history_payload: list[dict[str, Any]]) -> dict[str, Any] | None:
    latest = history_payload[-1] if history_payload else None
    previous = history_payload[-2] if len(history_payload) >= 2 else latest
    price = clean_number(data.get("regularMarketPrice") or data.get("price")) or clean_number((latest or {}).get("close"))
    previous_close = clean_number(data.get("regularMarketPreviousClose") or data.get("previousClose")) or clean_number((previous or {}).get("close"))
    if price is None:
        return None
    change_value = clean_number(data.get("regularMarketChange") or data.get("change"))
    if change_value is None and previous_close:
        change_value = price - previous_close
    change_percent = clean_number(data.get("regularMarketChangePercent") or data.get("changePercent"))
    if change_percent is None and change_value is not None and previous_close:
        change_percent = (change_value / previous_close) * 100
    return {
        "ticker": ticker,
        "price": price,
        "change_value": change_value,
        "change_percent": change_percent,
        "open": clean_number(data.get("regularMarketOpen") or data.get("open")),
        "high": clean_number(data.get("regularMarketDayHigh") or data.get("dayHigh")),
        "low": clean_number(data.get("regularMarketDayLow") or data.get("dayLow")),
        "previous_close": previous_close,
        "volume": clean_int(data.get("regularMarketVolume") or data.get("volume")),
        "market_cap": clean_number(data.get("marketCap")),
        "quote_date": now_iso(),
        "source": "brapi.dev",
        "updated_at": now_iso(),
    }

def brapi_asset_row(ticker: str, data: dict[str, Any]) -> dict[str, Any]:
    kind = kind_for_ticker(ticker)
    sector = clean_text(data.get("sector"))
    industry = clean_text(data.get("industry") or data.get("industryKey"))
    return {
        "ticker": ticker,
        "kind": kind,
        "name": clean_text(data.get("shortName") or data.get("symbol")) or ticker,
        "company_name": clean_text(data.get("longName") or data.get("companyName") or data.get("shortName")) or ticker,
        "cnpj": None,
        "sector": "Fundos Imobiliários" if kind == "fii" else sector,
        "industry": industry,
        "segment": clean_text(data.get("quoteType")),
        "website": clean_text(data.get("website")),
        "currency": clean_text(data.get("currency")) or "BRL",
        "source": "brapi.dev",
        "updated_at": now_iso(),
    }


TEXT_FIXES = {
    "El.trica": "Elétrica",
    "El.trico": "Elétrico",
    "Energia El trica": "Energia Elétrica",
    "Energia Eltrica": "Energia Elétrica",
    "N.o": "Não",
    "A..es": "Ações",
    "N�o": "Não",
    "A��es": "Ações",
    "El�trica": "Elétrica",
    "El�trico": "Elétrico",
    "Energ�tica": "Energética",
    "Petr�leo": "Petróleo",
    "G�s": "Gás",
    "Minera��o": "Mineração",
    "Constru��o": "Construção",
    "Comunica��o": "Comunicação",
    "Distribui��o": "Distribuição",
    "Transmiss�o": "Transmissão",
    "Servi�os": "Serviços",
    "Servi�o": "Serviço",
    "B�sicos": "Básicos",
    "B�sico": "Básico",
    "Imobili�rios": "Imobiliários",
    "Imobili�rio": "Imobiliário",
    "Com�rcio": "Comércio",
    "Alimenta��o": "Alimentação",
    "Educa��o": "Educação",
    "Sa�de": "Saúde",
    "Inform�tica": "Informática",
    "Telecomunica��es": "Telecomunicações",
    "Institui��es": "Instituições",
    "Administra��o": "Administração",
    "Gest�o": "Gestão",
    "Cr�dito": "Crédito",
    "M�quinas": "Máquinas",
    "Log�stica": "Logística",
    "A�reo": "Aéreo",
    "Qu�mica": "Química",
    "Sider�rgica": "Siderúrgica",
    "Agr�cola": "Agrícola",
    "Tecnol�gico": "Tecnológico",
    "Tecnol�gica": "Tecnológica",
}


MARKET_TEXT_TRANSLATIONS = {
    "energy": "Energia",
    "utilities": "Serviços de utilidade pública",
    "technology": "Tecnologia",
    "healthcare": "Saúde",
    "financialservices": "Serviços financeiros",
    "financial": "Financeiro",
    "banks": "Bancos",
    "insurance": "Seguros",
    "basicmaterials": "Materiais básicos",
    "materials": "Materiais básicos",
    "industrials": "Indústria",
    "consumerdefensive": "Consumo defensivo",
    "consumercyclical": "Consumo cíclico",
    "communicationservices": "Comunicação",
    "realestate": "Imobiliário",
    "reitdiversified": "FII - Diversificado",
    "reitindustrial": "FII - Galpões e logística",
    "reitretail": "FII - Shoppings e varejo",
    "reitoffice": "FII - Escritórios",
    "reitmortgage": "FII - Recebíveis imobiliários",
    "reithotelmotel": "FII - Hotelaria",
    "reithealthcarefacilities": "FII - Saúde",
    "reitspecialty": "FII - Especializado",
    "oilgasintegrated": "Petróleo e gás integrado",
    "oilgasep": "Exploração e produção de petróleo e gás",
    "oilgasrefiningmarketing": "Refino e distribuição de petróleo e gás",
    "oilgasmidstream": "Transporte e armazenamento de petróleo e gás",
    "oilgasequipmentservices": "Equipamentos e serviços de petróleo e gás",
    "electricutilities": "Energia elétrica",
    "regulatedelectric": "Energia elétrica regulada",
    "diversifiedutilities": "Utilidades públicas diversificadas",
    "utilitiesregulatedelectric": "Energia elétrica regulada",
    "banksregional": "Bancos regionais",
    "capitalmarkets": "Mercado de capitais",
    "assetmanagement": "Gestão de ativos",
    "steel": "Siderurgia",
    "aluminum": "Alumínio",
    "copper": "Cobre",
    "gold": "Ouro",
    "otherindustrialmetalsmining": "Mineração e metais industriais",
    "paperpaperproducts": "Papel e celulose",
    "packagingcontainers": "Embalagens",
    "beveragesbrewers": "Bebidas",
    "beveragesnonalcoholic": "Bebidas não alcoólicas",
    "fooddistribution": "Distribuição de alimentos",
    "grocerydiscountstores": "Supermercados e atacarejo",
    "departmentstores": "Lojas de departamento",
    "specialtyretail": "Varejo especializado",
    "apparelretail": "Varejo de vestuário",
    "railroads": "Ferrovias",
    "airportsairservices": "Aeroportos e serviços aéreos",
    "infrastructureoperations": "Operação de infraestrutura",
    "telecomservices": "Telecomunicações",
    "softwareapplication": "Software",
    "softwareinfrastructure": "Infraestrutura de software",
    "internetcontentinformation": "Internet e informação",
    "autoandtruckdealerships": "Concessionárias de veículos",
    "rentalleasingservices": "Aluguel e leasing",
    "drugmanufacturersgeneral": "Medicamentos",
    "medicalcarefacilities": "Serviços hospitalares",

    "farmandheavyconstructionmachinery": "Máquinas agrícolas e construção pesada",
    "farmheavyconstructionmachinery": "Máquinas agrícolas e construção pesada",
    "specialtyindustrialmachinery": "Máquinas industriais especializadas",
    "industrialdistribution": "Distribuição industrial",
    "buildingproductsandequipment": "Produtos e equipamentos para construção",
    "engineeringconstruction": "Engenharia e construção",
    "constructionengineering": "Engenharia e construção",
    "residentialconstruction": "Construção residencial",
    "buildingmaterials": "Materiais de construção",
    "conglomerates": "Conglomerados industriais",
    "automobiles": "Automóveis",
    "automakers": "Montadoras",
    "automanufacturers": "Montadoras",
    "autoparts": "Autopeças",
    "trucking": "Transporte rodoviário",
    "transportationinfrastructure": "Infraestrutura de transporte",
    "marineShipping": "Transporte marítimo",
    "marineshipping": "Transporte marítimo",
    "packagedfoods": "Alimentos industrializados",
    "fooddistribution": "Distribuição de alimentos",
    "restaurants": "Restaurantes",
    "householdpersonalproducts": "Produtos de uso pessoal e doméstico",
    "personalservices": "Serviços pessoais",
    "educationtrainingservices": "Educação e treinamento",
    "utilitiesregulatedgas": "Gás regulado",
    "gasutilities": "Distribuição de gás",
    "waterutilities": "Saneamento",
    "wastemanagement": "Gestão de resíduos",
    "realestateservices": "Serviços imobiliários",
    "realestatedevelopment": "Desenvolvimento imobiliário",
    "reitdiversified": "FII - Diversificado",
    "reitindustrial": "FII - Logística e galpões",
    "reitretail": "FII - Shopping e varejo",
    "reitspecialty": "FII - Especializado",
    "reitoffice": "FII - Escritórios",
    "reitresidential": "FII - Residencial",
    "semiconductors": "Semicondutores",
    "electroniccomponents": "Componentes eletrônicos",
    "scientifictechnicalinstruments": "Instrumentos técnicos e científicos",
    "creditservices": "Serviços de crédito",
    "insurancebrokers": "Corretores de seguros",
    "insurancepropertycasualty": "Seguros patrimoniais",
    "insurancelife": "Seguros de vida",
    "financialconglomerates": "Conglomerados financeiros",
    "shellcompanies": "Empresas de propósito específico",
    "cokingcoal": "Carvão mineral",
    "thermalcoal": "Carvão térmico",
    "chemicals": "Químicos",
    "specialtychemicals": "Químicos especializados",
    "agriculturalinputs": "Insumos agrícolas",
}


def normalize_market_text(value: str) -> str:
    normalized = value.casefold()
    normalized = normalized.replace("&", "and").replace("+", "and")
    normalized = re.sub(r"[^a-z0-9]+", "", normalized)
    return normalized


def translate_market_text(value: str) -> str:
    return MARKET_TEXT_TRANSLATIONS.get(normalize_market_text(value), value)


def clean_text(value: Any) -> str | None:
    if value is None:
        return None

    text = str(value).strip()

    for wrong, right in TEXT_FIXES.items():
        text = text.replace(wrong, right)

    # Correções de último recurso para strings com caractere quebrado no meio.
    text = re.sub(r"Energia\s+El.trica", "Energia Elétrica", text, flags=re.IGNORECASE)
    text = re.sub(r"El.trica", "Elétrica", text, flags=re.IGNORECASE)
    text = re.sub(r"El.trico", "Elétrico", text, flags=re.IGNORECASE)

    text = " ".join(text.replace("�", "").split())
    if not text:
        return None

    return translate_market_text(text)


def get_info(asset: yf.Ticker) -> dict[str, Any]:
    try:
        info = asset.get_info()
        return info if isinstance(info, dict) else {}
    except Exception:
        return {}


def get_statement_frame(asset: yf.Ticker, names: list[str]) -> pd.DataFrame:
    for name in names:
        try:
            value = getattr(asset, name)
            if isinstance(value, pd.DataFrame) and not value.empty:
                return value
        except Exception:
            continue

    return pd.DataFrame()


def fetch_history(asset: yf.Ticker, period: str = "10y") -> pd.DataFrame:
    try:
        history = asset.history(period=period, interval="1d", auto_adjust=False)
    except Exception:
        return pd.DataFrame()

    if history is None or history.empty:
        return pd.DataFrame()

    return history.reset_index()


def history_rows(ticker: str, history: pd.DataFrame) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []

    for _, row in history.iterrows():
        raw_date = row.get("Date")
        if raw_date is None:
            continue

        date = pd.to_datetime(raw_date).date().isoformat()
        close = clean_number(row.get("Close"))
        volume = clean_int(row.get("Volume"))

        if close is None:
            continue

        rows.append({
            "ticker": ticker,
            "date": date,
            "close": close,
            "volume": volume,
            "source": "Yahoo/yfinance",
            "updated_at": now_iso(),
        })

    return rows


def dividend_rows(ticker: str, asset: yf.Ticker) -> list[dict[str, Any]]:
    try:
        dividends = asset.dividends
    except Exception:
        return []

    if dividends is None or dividends.empty:
        return []

    kind = kind_for_ticker(ticker)
    rows: list[dict[str, Any]] = []

    for raw_date, raw_value in dividends.items():
        value = clean_number(raw_value)
        if value is None or value <= 0:
            continue

        date = pd.to_datetime(raw_date).date().isoformat()
        rows.append({
            "ticker": ticker,
            "type": "Rendimento" if kind == "fii" else "Dividendo",
            "value": value,
            "com_date": None,
            "payment_date": date,
            "source": "Yahoo/yfinance",
            "updated_at": now_iso(),
        })

    return rows


def quote_row(ticker: str, history: pd.DataFrame, info: dict[str, Any]) -> dict[str, Any] | None:
    if history.empty:
        return None

    last = history.iloc[-1]
    previous = history.iloc[-2] if len(history) >= 2 else last

    price = clean_number(last.get("Close"))
    previous_close = clean_number(previous.get("Close"))

    if price is None:
        return None

    change_value = price - previous_close if previous_close is not None else None
    change_percent = (change_value / previous_close) * 100 if change_value is not None and previous_close else None

    return {
        "ticker": ticker,
        "price": price,
        "change_value": change_value,
        "change_percent": change_percent,
        "open": clean_number(last.get("Open")),
        "high": clean_number(last.get("High")),
        "low": clean_number(last.get("Low")),
        "previous_close": previous_close,
        "volume": clean_int(last.get("Volume")),
        "market_cap": clean_number(info.get("marketCap")),
        "quote_date": now_iso(),
        "source": "Yahoo/yfinance",
        "updated_at": now_iso(),
    }


def asset_row(ticker: str, info: dict[str, Any]) -> dict[str, Any]:
    kind = kind_for_ticker(ticker)
    sector = clean_text(info.get("sector"))
    industry = clean_text(info.get("industry"))

    if ticker == "CMIG4":
        # O Yahoo às vezes devolve o setor com acentuação quebrada; garantimos
        # um fallback limpo para não poluir a interface.
        sector = sector or "Energia Elétrica"
        industry = industry or "Energia Elétrica"

    return {
        "ticker": ticker,
        "kind": kind,
        "name": clean_text(info.get("shortName")) or clean_text(info.get("symbol")) or ticker,
        "company_name": clean_text(info.get("longName")) or clean_text(info.get("shortName")) or ticker,
        "cnpj": None,
        "sector": "Fundos Imobiliários" if kind == "fii" else sector,
        "industry": industry,
        "segment": clean_text(info.get("quoteType")),
        "website": clean_text(info.get("website")),
        "currency": clean_text(info.get("currency")) or "BRL",
        "source": "Yahoo/yfinance",
        "updated_at": now_iso(),
    }


def normalize_label(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def statement_value(frame: pd.DataFrame, column: Any, aliases: list[str]) -> float | None:
    if frame.empty:
        return None

    normalized_index = {normalize_label(str(index)): index for index in frame.index}

    for alias in aliases:
        key = normalize_label(alias)
        index = normalized_index.get(key)
        if index is None:
            continue

        try:
            return clean_number(frame.loc[index, column])
        except Exception:
            continue

    return None


def reference_period(date_value: pd.Timestamp, period_type: str) -> str:
    year = int(date_value.year)
    if period_type == "annual":
        return "FY"

    quarter = ((int(date_value.month) - 1) // 3) + 1
    return f"{quarter}T{year}"


def financial_rows_from_frames(
    ticker: str,
    period_type: str,
    income: pd.DataFrame,
    balance: pd.DataFrame,
    cashflow: pd.DataFrame,
) -> list[dict[str, Any]]:
    columns = []
    for frame in [income, balance, cashflow]:
        if not frame.empty:
            columns.extend(list(frame.columns))

    # Remove duplicatas preservando ordem mais recente.
    unique_columns: list[Any] = []
    for column in columns:
        if column not in unique_columns:
            unique_columns.append(column)

    rows: list[dict[str, Any]] = []

    for column in unique_columns[:8]:
        try:
            date_value = pd.to_datetime(column)
        except Exception:
            continue

        revenue = statement_value(income, column, ["Total Revenue", "Operating Revenue", "Revenue"])
        gross_profit = statement_value(income, column, ["Gross Profit"])
        ebit = statement_value(income, column, ["EBIT", "Operating Income"])
        ebitda = statement_value(income, column, ["EBITDA", "Normalized EBITDA"])
        net_income = statement_value(income, column, ["Net Income", "Net Income Common Stockholders", "Net Income From Continuing Operation Net Minority Interest"])

        total_assets = statement_value(balance, column, ["Total Assets"])
        current_assets = statement_value(balance, column, ["Current Assets", "Total Current Assets"])
        total_liabilities = statement_value(balance, column, ["Total Liabilities Net Minority Interest", "Total Liab", "Total Liabilities"])
        equity = statement_value(balance, column, ["Stockholders Equity", "Total Equity Gross Minority Interest", "Total Stockholder Equity", "Common Stock Equity"])

        operating_cash_flow = statement_value(cashflow, column, ["Operating Cash Flow", "Total Cash From Operating Activities"])
        capex = statement_value(cashflow, column, ["Capital Expenditure", "Capital Expenditures"])
        free_cash_flow = statement_value(cashflow, column, ["Free Cash Flow"])
        if free_cash_flow is None and operating_cash_flow is not None and capex is not None:
            free_cash_flow = operating_cash_flow + capex

        if not any(value is not None for value in [revenue, gross_profit, ebit, ebitda, net_income, total_assets, equity, operating_cash_flow]):
            continue

        rows.append({
            "ticker": ticker,
            "period_type": period_type,
            "reference_year": int(date_value.year),
            "reference_period": reference_period(date_value, period_type),
            "reference_date": date_value.date().isoformat(),
            "total_assets": total_assets,
            "current_assets": current_assets,
            "total_liabilities": total_liabilities,
            "equity": equity,
            "revenue": revenue,
            "gross_profit": gross_profit,
            "ebit": ebit,
            "ebitda": ebitda,
            "net_income": net_income,
            "operating_cash_flow": operating_cash_flow,
            "capex": capex,
            "free_cash_flow": free_cash_flow,
            "source": "Yahoo/yfinance demonstrativos",
            "updated_at": now_iso(),
        })

    return rows


def financial_rows(ticker: str, asset: yf.Ticker) -> list[dict[str, Any]]:
    annual_income = get_statement_frame(asset, ["income_stmt", "financials"])
    annual_balance = get_statement_frame(asset, ["balance_sheet"])
    annual_cashflow = get_statement_frame(asset, ["cashflow"])

    quarterly_income = get_statement_frame(asset, ["quarterly_income_stmt", "quarterly_financials"])
    quarterly_balance = get_statement_frame(asset, ["quarterly_balance_sheet"])
    quarterly_cashflow = get_statement_frame(asset, ["quarterly_cashflow"])

    return [
        *financial_rows_from_frames(ticker, "annual", annual_income, annual_balance, annual_cashflow),
        *financial_rows_from_frames(ticker, "quarterly", quarterly_income, quarterly_balance, quarterly_cashflow),
    ]


def current_indicator_row(
    ticker: str,
    info: dict[str, Any],
    quote: dict[str, Any] | None,
    annual_financials: list[dict[str, Any]],
) -> dict[str, Any] | None:
    if not info and not quote and not annual_financials:
        return None

    latest_financial = annual_financials[0] if annual_financials else {}
    market_cap = clean_number(info.get("marketCap")) or (quote or {}).get("market_cap")
    shares = clean_number(info.get("sharesOutstanding")) or clean_number(info.get("impliedSharesOutstanding"))

    net_income = clean_number(latest_financial.get("net_income"))
    equity = clean_number(latest_financial.get("equity"))
    total_assets = clean_number(latest_financial.get("total_assets"))
    revenue = clean_number(latest_financial.get("revenue"))
    ebit = clean_number(latest_financial.get("ebit"))
    ebitda = clean_number(latest_financial.get("ebitda")) or clean_number(info.get("ebitda"))

    total_debt = clean_number(info.get("totalDebt"))
    total_cash = clean_number(info.get("totalCash"))
    enterprise_value = clean_number(info.get("enterpriseValue"))

    # Algumas companhias não retornam todos os indicadores prontos. Quando os
    # demonstrativos e campos de mercado existem, calculamos uma aproximação
    # conservadora para reduzir campos vazios na interface.
    net_debt = None
    if total_debt is not None:
        net_debt = total_debt - (total_cash or 0)

    invested_capital = None
    if equity is not None and total_debt is not None:
        invested_capital = equity + total_debt - (total_cash or 0)

    dividend_yield = clean_number(info.get("dividendYield"))
    if dividend_yield is not None and abs(dividend_yield) <= 1:
        dividend_yield *= 100

    pe = clean_number(info.get("trailingPE"))
    if pe is None and market_cap is not None and net_income:
        pe = market_cap / net_income

    pvp = clean_number(info.get("priceToBook"))
    if pvp is None and market_cap is not None and equity:
        pvp = market_cap / equity

    roe = clean_number(info.get("returnOnEquity"))
    if roe is not None and abs(roe) <= 1:
        roe *= 100
    if roe is None and net_income is not None and equity:
        roe = (net_income / equity) * 100

    roa = clean_number(info.get("returnOnAssets"))
    if roa is not None and abs(roa) <= 1:
        roa *= 100
    if roa is None and net_income is not None and total_assets:
        roa = (net_income / total_assets) * 100

    net_margin = clean_number(info.get("profitMargins"))
    if net_margin is not None and abs(net_margin) <= 1:
        net_margin *= 100
    if net_margin is None and net_income is not None and revenue:
        net_margin = (net_income / revenue) * 100

    book_value_per_share = clean_number(info.get("bookValue"))
    if book_value_per_share is None and equity is not None and shares:
        book_value_per_share = equity / shares

    roic = clean_number(info.get("returnOnInvestedCapital")) or clean_number(info.get("returnOnCapital"))
    if roic is not None and abs(roic) <= 1:
        roic *= 100
    if roic is None and ebit is not None and invested_capital:
        roic = (ebit / invested_capital) * 100

    ev_ebitda = clean_number(info.get("enterpriseToEbitda"))
    if ev_ebitda is None and enterprise_value is not None and ebitda:
        ev_ebitda = enterprise_value / ebitda

    debt_ebitda = clean_number(info.get("netDebtToEBITDA")) or clean_number(info.get("debtToEbitda"))
    if debt_ebitda is None and net_debt is not None and ebitda:
        debt_ebitda = net_debt / ebitda

    return {
        "ticker": ticker,
        "reference_date": today_iso(),
        "pe": pe,
        "pvp": pvp,
        "dividend_yield": dividend_yield,
        "roe": roe,
        "roa": roa,
        "roic": roic,
        "net_margin": net_margin,
        "ev_ebitda": ev_ebitda,
        "debt_ebitda": debt_ebitda,
        "book_value_per_share": book_value_per_share,
        "market_cap": market_cap,
        "shares_outstanding": shares,
        "vp_per_share": book_value_per_share,
        "dividend_per_share": clean_number(info.get("dividendRate")) or clean_number(info.get("trailingAnnualDividendRate")),
        "source": "Yahoo/yfinance + demonstrativos",
        "updated_at": now_iso(),
    }


def last_close_by_year(history_payload: list[dict[str, Any]]) -> dict[int, dict[str, Any]]:
    closes: dict[int, dict[str, Any]] = {}

    for row in history_payload:
        date = str(row["date"])
        year = int(date[:4])
        existing = closes.get(year)

        if existing is None or date > str(existing["date"]):
            closes[year] = {
                "date": date,
                "close": row["close"],
            }

    return closes


def dividends_by_year(dividend_payload: list[dict[str, Any]]) -> dict[int, float]:
    totals: dict[int, float] = {}

    for row in dividend_payload:
        payment_date = row.get("payment_date")
        value = clean_number(row.get("value"))

        if not payment_date or value is None:
            continue

        year = int(str(payment_date)[:4])
        totals[year] = totals.get(year, 0.0) + value

    return totals


def financial_by_year(financial_payload: list[dict[str, Any]]) -> dict[int, dict[str, Any]]:
    annual_rows = [row for row in financial_payload if row.get("period_type") == "annual" and row.get("reference_year")]
    annual_rows.sort(key=lambda row: str(row.get("reference_date") or row.get("reference_year") or ""), reverse=True)

    by_year: dict[int, dict[str, Any]] = {}
    for row in annual_rows:
        year = int(row["reference_year"])
        if year not in by_year:
            by_year[year] = row

    return by_year


def annual_indicator_rows(
    ticker: str,
    info: dict[str, Any],
    quote: dict[str, Any] | None,
    history_payload: list[dict[str, Any]],
    dividend_payload: list[dict[str, Any]],
    financial_payload: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Cria linhas de indicadores anuais calculáveis com preço, proventos e
    demonstrativos retornados pelo Yahoo/yfinance.
    """
    rows: list[dict[str, Any]] = []
    annual_financials = [row for row in financial_payload if row.get("period_type") == "annual"]
    current = current_indicator_row(ticker, info, quote, annual_financials)

    if current:
        rows.append(current)

    closes = last_close_by_year(history_payload)
    dividends = dividends_by_year(dividend_payload)
    financials = financial_by_year(financial_payload)
    current_year = datetime.now(timezone.utc).year
    shares = clean_number(info.get("sharesOutstanding")) or clean_number(info.get("impliedSharesOutstanding"))
    years = sorted(set(closes.keys()) | set(dividends.keys()) | set(financials.keys()), reverse=True)

    for year in years:
        # O ano atual já entra pela linha de hoje, que traz mais campos.
        if year == current_year:
            continue

        close_row = closes.get(year)
        close = clean_number(close_row.get("close")) if close_row else None
        dividend_total = dividends.get(year)
        dividend_yield = (dividend_total / close) * 100 if dividend_total and close else None
        market_cap = close * shares if close is not None and shares is not None else None
        reference_date = close_row.get("date") if close_row else f"{year}-12-31"
        fin = financials.get(year, {})

        net_income = clean_number(fin.get("net_income"))
        equity = clean_number(fin.get("equity"))
        revenue = clean_number(fin.get("revenue"))
        total_assets = clean_number(fin.get("total_assets"))

        ebit = clean_number(fin.get("ebit"))
        ebitda = clean_number(fin.get("ebitda"))
        total_liabilities = clean_number(fin.get("total_liabilities"))
        invested_capital_year = equity + total_liabilities if equity is not None and total_liabilities is not None else None

        rows.append({
            "ticker": ticker,
            "reference_date": reference_date,
            "pe": (market_cap / net_income) if market_cap is not None and net_income else None,
            "pvp": (market_cap / equity) if market_cap is not None and equity else None,
            "dividend_yield": dividend_yield,
            "roe": (net_income / equity) * 100 if net_income is not None and equity else None,
            "roa": (net_income / total_assets) * 100 if net_income is not None and total_assets else None,
            "roic": (ebit / invested_capital_year) * 100 if ebit is not None and invested_capital_year else None,
            "net_margin": (net_income / revenue) * 100 if net_income is not None and revenue else None,
            "ev_ebitda": (market_cap / ebitda) if market_cap is not None and ebitda else None,
            "debt_ebitda": (total_liabilities / ebitda) if total_liabilities is not None and ebitda else None,
            "book_value_per_share": (equity / shares) if equity is not None and shares else None,
            "market_cap": market_cap,
            "shares_outstanding": shares,
            "vp_per_share": (equity / shares) if equity is not None and shares else None,
            "dividend_per_share": dividend_total,
            "source": "Yahoo/yfinance calculado",
            "updated_at": now_iso(),
        })

    return rows


def persist_asset_payloads(
    client: SupabaseRestClient,
    normalized: str,
    asset_payload: dict[str, Any],
    quote_payload: dict[str, Any] | None,
    history_payload: list[dict[str, Any]],
    dividend_payload: list[dict[str, Any]],
    financial_payload: list[dict[str, Any]],
    indicator_payload: list[dict[str, Any]],
) -> None:
    client.upsert("assets", asset_payload, on_conflict="ticker")

    if quote_payload:
        client.upsert("asset_quotes", quote_payload)

    if history_payload:
        chunk_size = 500
        for start in range(0, len(history_payload), chunk_size):
            client.upsert(
                "asset_price_history",
                history_payload[start:start + chunk_size],
                on_conflict="ticker,date",
            )

    if financial_payload:
        chunk_size = 300
        for start in range(0, len(financial_payload), chunk_size):
            client.upsert(
                "asset_financials",
                financial_payload[start:start + chunk_size],
                on_conflict="ticker,period_type,reference_year,reference_period",
            )

    if indicator_payload:
        chunk_size = 500
        for start in range(0, len(indicator_payload), chunk_size):
            client.upsert(
                "asset_indicators",
                indicator_payload[start:start + chunk_size],
                on_conflict="ticker,reference_date",
            )

    client.delete_matching("asset_dividends", {"ticker": f"eq.{normalized}"})
    if dividend_payload:
        chunk_size = 500
        for start in range(0, len(dividend_payload), chunk_size):
            client.upsert("asset_dividends", dividend_payload[start:start + chunk_size])


def update_one(client: SupabaseRestClient, ticker: str) -> dict[str, Any]:
    normalized = resolve_current_ticker(ticker)
    symbol = yahoo_symbol(normalized)
    asset = yf.Ticker(symbol)
    info = get_info(asset)
    history = fetch_history(asset, period="10y")

    if history.empty:
        brapi_data = fetch_brapi_classic_quote(normalized)
        if brapi_data:
            history_payload = brapi_history_rows(normalized, brapi_data)
            quote_payload = brapi_quote_row(normalized, brapi_data, history_payload)
            dividend_payload = brapi_dividend_rows(normalized, brapi_data)
            asset_payload = brapi_asset_row(normalized, brapi_data)
            financial_payload: list[dict[str, Any]] = []
            indicator_payload = annual_indicator_rows(normalized, brapi_data, quote_payload, history_payload, dividend_payload, financial_payload)

            if quote_payload or history_payload:
                persist_asset_payloads(client, normalized, asset_payload, quote_payload, history_payload, dividend_payload, financial_payload, indicator_payload)
                return {
                    "ticker": normalized,
                    "ok": True,
                    "fallback": "brapi.dev",
                    "history_rows": len(history_payload),
                    "dividend_rows": len(dividend_payload),
                    "financial_rows": len(financial_payload),
                    "indicator_rows": len(indicator_payload),
                    "price": quote_payload.get("price") if quote_payload else None,
                    "market_cap": quote_payload.get("market_cap") if quote_payload else None,
                }

        return {
            "ticker": normalized,
            "ok": False,
            "message": "Sem histórico retornado pelo Yahoo/yfinance e sem fallback útil na brapi.dev.",
        }

    asset_payload = asset_row(normalized, info)
    quote_payload = quote_row(normalized, history, info)
    history_payload = history_rows(normalized, history)
    dividend_payload = dividend_rows(normalized, asset)
    financial_payload = financial_rows(normalized, asset) if kind_for_ticker(normalized) == "stock" else []
    indicator_payload = annual_indicator_rows(normalized, info, quote_payload, history_payload, dividend_payload, financial_payload)

    persist_asset_payloads(client, normalized, asset_payload, quote_payload, history_payload, dividend_payload, financial_payload, indicator_payload)

    return {
        "ticker": normalized,
        "ok": True,
        "history_rows": len(history_payload),
        "dividend_rows": len(dividend_payload),
        "financial_rows": len(financial_payload),
        "indicator_rows": len(indicator_payload),
        "price": quote_payload.get("price") if quote_payload else None,
        "market_cap": quote_payload.get("market_cap") if quote_payload else None,
    }


def main(args: list[str]) -> int:
    load_project_env()

    supabase_url = get_required_env("SUPABASE_URL")
    supabase_key = get_required_env("SUPABASE_SERVICE_ROLE_KEY")

    client = SupabaseRestClient(SupabaseConfig(url=supabase_url, key=supabase_key))

    tickers = [arg.upper().replace(".SA", "") for arg in args] if args else CORE_TICKERS

    print(f"Atualizando {len(tickers)} ativos...")

    ok_count = 0

    for ticker in tickers:
        try:
            result = update_one(client, ticker)
            print(result)
            ok_count += 1 if result.get("ok") else 0
        except Exception as exc:
            print({
                "ticker": ticker,
                "ok": False,
                "error": str(exc),
            })

    print({
        "finished": True,
        "ok": ok_count,
        "total": len(tickers),
        "assets_count": client.select_count("assets"),
        "history_count": client.select_count("asset_price_history"),
        "financial_count": client.select_count("asset_financials"),
        "indicator_count": client.select_count("asset_indicators"),
        "dividend_count": client.select_count("asset_dividends"),
    })

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
