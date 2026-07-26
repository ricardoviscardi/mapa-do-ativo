"""
Atualiza indicadores públicos de FIIs pelo Fundamentus como complemento da base Yahoo/CVM.

Objetivo: reduzir páginas pobres de FIIs quando as fontes de cotação trazem só preço,
histórico e proventos. Esta rotina grava indicadores atuais/anuais sintéticos no
Supabase para que o snapshot publicado pelo GitHub Actions consiga exibir P/VP,
VP/Cota, DY, valor de mercado, número de cotas, patrimônio e algumas informações
regulatórias disponíveis publicamente.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import time
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

import requests
from config import ROOT_DIR, get_required_env, load_project_env
from supabase_rest import SupabaseConfig, SupabaseRestClient
from tickers import FII_TICKERS
from b3_universe import load_b3_fii_tickers

FUNDAMENTUS_URL = "https://www.fundamentus.com.br/detalhes.php"
REPORTS_DIR = ROOT_DIR / "reports"


def normalize_ticker(value: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", value.upper().replace(".SA", ""))


def normalize_cnpj(value: str | None) -> str | None:
    if not value:
        return None
    digits = re.sub(r"\D", "", str(value))
    return digits if len(digits) == 14 else None


def normalize_key(value: str) -> str:
    text = html.unescape(value)
    text = re.sub(r"<[^>]+>", " ", text)
    text = text.strip().lower()
    replacements = {
        "º": "o",
        "°": "o",
        "nº": "nro",
        "n°": "nro",
        "últ": "ult",
        "ult.": "ult",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    text = (
        text.replace("á", "a")
        .replace("à", "a")
        .replace("â", "a")
        .replace("ã", "a")
        .replace("é", "e")
        .replace("ê", "e")
        .replace("í", "i")
        .replace("ó", "o")
        .replace("ô", "o")
        .replace("õ", "o")
        .replace("ú", "u")
        .replace("ç", "c")
    )
    text = re.sub(r"[^a-z0-9]+", "_", text)
    return text.strip("_")


def strip_html(value: str) -> str:
    value = re.sub(r"<script[\s\S]*?</script>", " ", value, flags=re.I)
    value = re.sub(r"<style[\s\S]*?</style>", " ", value, flags=re.I)
    value = re.sub(r"<[^>]+>", " ", value)
    value = html.unescape(value)
    return re.sub(r"\s+", " ", value).strip()


def parse_pairs(page: str) -> dict[str, str]:
    raw: dict[str, str] = {}
    for row_match in re.finditer(r"<tr[^>]*>([\s\S]*?)</tr>", page, flags=re.I):
        cells = [strip_html(match.group(1)) for match in re.finditer(r"<t[dh][^>]*>([\s\S]*?)</t[dh]>", row_match.group(1), flags=re.I)]
        cells = [cell for cell in cells if cell]
        if len(cells) < 2:
            continue
        for index in range(0, len(cells) - 1, 2):
            label = cells[index]
            value = cells[index + 1]
            key = normalize_key(label)
            if not key or key == normalize_key(value):
                continue
            raw[key] = value
    return raw


def parse_number(value: str | None) -> float | None:
    if value is None:
        return None
    value = value.strip()
    if not value or value == "-":
        return None
    negative = value.startswith("-")
    clean = (
        value.replace("R$", "")
        .replace("%", "")
        .replace(".", "")
        .replace(" ", "")
        .replace("-", "")
        .replace(",", ".")
    )
    try:
        number = float(clean)
    except ValueError:
        return None
    return -number if negative else number


def pick_raw(raw: dict[str, str], keys: list[str]) -> str | None:
    for key in keys:
        if key in raw:
            return raw[key]
    return None


def pick_number(raw: dict[str, str], keys: list[str]) -> float | None:
    return parse_number(pick_raw(raw, keys))


def safe_percent(value: float | None, max_abs: float = 50) -> float | None:
    if value is None:
        return None
    if abs(value) <= max_abs:
        return value
    return None


def fetch_fundamentus(ticker: str) -> dict[str, str] | None:
    response = requests.get(
        FUNDAMENTUS_URL,
        params={"papel": ticker},
        headers={
            "User-Agent": "Mozilla/5.0 MapaDoAtivoDataUpdater/1.53.19",
            "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
            "Referer": "https://www.fundamentus.com.br/",
        },
        timeout=30,
    )
    if response.status_code != 200:
        return None
    response.encoding = response.encoding or "ISO-8859-1"
    raw = parse_pairs(response.text)
    if not raw:
        return None
    # Aceita apenas FIIs ou páginas com campos típicos de fundos imobiliários.
    if not any(key in raw for key in ["mandato", "gestao", "segmento", "nro_cotas", "vp_cota", "dividendo_cota"]):
        return None
    return raw


def build_rows(ticker: str, raw: dict[str, str]) -> tuple[dict[str, Any], dict[str, Any] | None, dict[str, Any] | None, dict[str, Any] | None]:
    now = datetime.now(timezone.utc).isoformat()
    today = date.today()
    reference_date = date(today.year, 12, 31).isoformat()

    name = pick_raw(raw, ["papel", "fii", "nome", "empresa"]) or ticker
    cnpj = normalize_cnpj(pick_raw(raw, ["cnpj", "cnpj_fundo", "cnpj_do_fundo"]))
    segment = pick_raw(raw, ["segmento", "mandato"])
    mandate = pick_raw(raw, ["mandato", "gestao"])

    price = pick_number(raw, ["cotacao"])
    market_cap = pick_number(raw, ["valor_de_mercado"])
    volume = pick_number(raw, ["vol_med_2m", "vol_med_2_m", "liquidez_2_meses"])
    pvp = pick_number(raw, ["p_vp"])
    dividend_yield = safe_percent(pick_number(raw, ["div_yield", "dividend_yield"]), 35)
    vp_per_share = pick_number(raw, ["vp_cota"])
    dividend_per_share = pick_number(raw, ["dividendo_cota"])
    shares = pick_number(raw, ["nro_cotas"])
    patrimony = pick_number(raw, ["patrim_liq", "patrim_liquido"])
    assets = pick_number(raw, ["ativo", "ativos"])
    revenue = pick_number(raw, ["receita_liquida_12m", "receita_liquida", "receita"])
    ebit = pick_number(raw, ["ebit_12m", "ebit"])
    net_income = pick_number(raw, ["lucro_liquido_12m", "lucro_liquido", "lucro"])
    distributed = pick_number(raw, ["rend_distribuido", "rendimento_distribuido"])

    if market_cap is None and price and shares:
        market_cap = price * shares
    if patrimony is None and vp_per_share and shares:
        patrimony = vp_per_share * shares
    if pvp is None and market_cap and patrimony:
        pvp = market_cap / patrimony

    asset = {
        "ticker": ticker,
        "kind": "fii",
        "name": name,
        "company_name": name,
        "cnpj": cnpj,
        "sector": "Fundos Imobiliários",
        "industry": segment or mandate or "Fundo imobiliário",
        "segment": mandate or segment,
        "currency": "BRL",
        "source": "Fundamentus público + Yahoo/yfinance",
        "updated_at": now,
    }

    quote = None
    if price is not None or market_cap is not None or volume is not None:
        quote = {
            "ticker": ticker,
            "price": price,
            "volume": volume,
            "market_cap": market_cap,
            "quote_date": now,
            "source": "Fundamentus público",
            "updated_at": now,
        }

    indicator = {
        "ticker": ticker,
        "reference_date": reference_date,
        "pvp": pvp,
        "dividend_yield": dividend_yield,
        "market_cap": market_cap,
        "shares_outstanding": shares,
        "vp_per_share": vp_per_share,
        "dividend_per_share": dividend_per_share,
        "source": "Fundamentus público",
        "updated_at": now,
    }

    financial = None
    if assets is not None or patrimony is not None or revenue is not None or net_income is not None or distributed is not None:
        financial = {
            "ticker": ticker,
            "period_type": "annual",
            "reference_year": today.year,
            "reference_period": "FY",
            "reference_date": reference_date,
            "total_assets": assets,
            "equity": patrimony,
            "revenue": revenue,
            "ebit": ebit,
            "net_income": net_income,
            "dividends_paid": distributed,
            "source": "Fundamentus público",
            "updated_at": now,
        }

    return asset, quote, indicator, financial


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Atualiza indicadores públicos de FIIs pelo Fundamentus.")
    parser.add_argument("--ticker", action="append", default=[], help="Ticker específico. Pode repetir.")
    parser.add_argument("--all", action="store_true", help="Atualiza todos os FIIs da base ampliada.")
    parser.add_argument("--b3-fiis", action="store_true", help="Atualiza universo amplo/dinâmico de FIIs da B3 via BRAPI/fallback.")
    parser.add_argument("--sleep", type=float, default=1.0)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    load_project_env()
    client = SupabaseRestClient(SupabaseConfig(url=get_required_env("SUPABASE_URL"), key=get_required_env("SUPABASE_SERVICE_ROLE_KEY")))

    if args.ticker:
        tickers = [normalize_ticker(item) for item in args.ticker]
    elif args.b3_fiis:
        tickers = load_b3_fii_tickers()
    else:
        tickers = FII_TICKERS
    if not args.all and not args.ticker and not args.b3_fiis:
        tickers = FII_TICKERS[:30]

    results: list[dict[str, Any]] = []
    for index, ticker in enumerate(tickers, start=1):
        try:
            raw = fetch_fundamentus(ticker)
            if not raw:
                result = {"ticker": ticker, "ok": False, "message": "Fundamentus sem dados úteis."}
            else:
                asset, quote, indicator, financial = build_rows(ticker, raw)
                client.upsert("assets", asset, on_conflict="ticker")
                if quote:
                    client.upsert("asset_quotes", quote)
                if indicator:
                    client.upsert("asset_indicators", indicator, on_conflict="ticker,reference_date")
                if financial:
                    client.upsert("asset_financials", financial, on_conflict="ticker,period_type,reference_year,reference_period")
                result = {
                    "ticker": ticker,
                    "ok": True,
                    "quote": bool(quote),
                    "indicator": bool(indicator),
                    "financial": bool(financial),
                }
        except Exception as exc:
            result = {"ticker": ticker, "ok": False, "error": str(exc)}

        results.append(result)
        print({"progress": f"{index}/{len(tickers)}", **result})
        if args.sleep and index < len(tickers):
            time.sleep(args.sleep)

    REPORTS_DIR.mkdir(exist_ok=True)
    report_path = REPORTS_DIR / f"update-fiis-fundamentus-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}.json"
    report_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print({"finished": True, "ok": sum(1 for item in results if item.get("ok")), "total": len(results), "report": str(report_path)})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
