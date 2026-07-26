"""
Atualiza dados regulatórios de FIIs pela CVM.

A CVM não publica uma lista de tickers negociados em bolsa no mesmo arquivo do
cadastro/informe diário. Por isso esta rotina usa os FIIs já cadastrados no
Supabase, preferencialmente com CNPJ preenchido pelo Fundamentus/BRAPI, e casa
com os arquivos públicos da CVM por CNPJ ou por semelhança de nome.

Dados usados:
- Cadastro de FIIs: cad_fii.csv
- Informe diário de FIIs: inf_diario_fii_{ano}.csv

Campos gravados:
- assets: CNPJ, nome/razão social e metadados cadastrais.
- asset_financials: PL/patrimônio como equity e total_assets quando disponível.
- asset_indicators: VP/Cota, nº de cotistas/cotas e P/VP calculável quando houver preço.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import math
import os
import re
import socket
import time
import unicodedata
from datetime import date, datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

import pandas as pd
import requests
import urllib3.util.connection as urllib3_connection

from config import ROOT_DIR, get_required_env, load_project_env
from supabase_rest import SupabaseConfig, SupabaseRestClient

CVM_FII_CAD_URL = "https://dados.cvm.gov.br/dados/FII/CAD/DADOS/cad_fii.csv"
CVM_FII_INF_DIARIO_URL = "https://dados.cvm.gov.br/dados/FII/DOC/INF_DIARIO/DADOS/inf_diario_fii_{year}.csv"
CVM_CACHE_DIR = Path(os.environ.get("CVM_CACHE_DIR", str(ROOT_DIR / ".cache" / "cvm")))
REPORTS_DIR = ROOT_DIR / "reports"

CVM_RETRY_ATTEMPTS = int(os.environ.get("CVM_RETRY_ATTEMPTS", "6"))
CVM_RETRY_BASE_SLEEP = float(os.environ.get("CVM_RETRY_BASE_SLEEP", "10"))
CVM_FORCE_IPV4 = os.environ.get("CVM_FORCE_IPV4", "1").lower() not in {"0", "false", "no", "nao"}

if CVM_FORCE_IPV4:
    def _cvm_allowed_gai_family() -> socket.AddressFamily:
        return socket.AF_INET

    urllib3_connection.allowed_gai_family = _cvm_allowed_gai_family

CVM_SESSION = requests.Session()
CVM_SESSION.headers.update({
    "User-Agent": "MapaDoAtivoDataUpdater/1.53.33 (+https://github.com/ricardoviscardi/mapa-do-ativo)",
    "Accept": "text/csv,application/octet-stream,*/*",
})


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def norm(value: Any) -> str:
    if value is None:
        return ""
    text = unicodedata.normalize("NFD", str(value).upper())
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = re.sub(r"[^A-Z0-9]+", " ", text)
    text = re.sub(r"\b(FUNDO|INVESTIMENTO|IMOBILIARIO|IMOBILIÁRIOS|FII|RESPONSABILIDADE|LIMITADA|LTDA|CNPJ|S A|SA)\b", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def digits(value: Any) -> str:
    return re.sub(r"\D", "", str(value or ""))


def cnpj14(value: Any) -> str | None:
    cnpj = digits(value)
    return cnpj if len(cnpj) == 14 else None


def clean_number(value: Any) -> float | None:
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except TypeError:
        pass
    text = str(value).strip()
    if not text or text == "-":
        return None
    text = text.replace("R$", "").replace("%", "").replace(" ", "")
    # CVM usa vírgula decimal e ponto de milhar.
    text = text.replace(".", "").replace(",", ".")
    try:
        number = float(text)
    except ValueError:
        return None
    return number if math.isfinite(number) else None


def parse_date(value: Any) -> str | None:
    try:
        parsed = pd.to_datetime(value, errors="coerce", dayfirst=False)
        if pd.isna(parsed):
            parsed = pd.to_datetime(value, errors="coerce", dayfirst=True)
        if pd.isna(parsed):
            return None
        return parsed.date().isoformat()
    except Exception:
        return None


def cvm_cache_path(url: str) -> Path:
    base_name = url.rstrip("/").split("/")[-1] or hashlib.sha1(url.encode("utf-8")).hexdigest()
    safe_name = re.sub(r"[^A-Za-z0-9_.-]+", "_", base_name)
    return CVM_CACHE_DIR / safe_name


def read_cvm_cache(url: str) -> bytes | None:
    path = cvm_cache_path(url)
    if not path.exists():
        return None
    try:
        data = path.read_bytes()
        print({"warning": "cvm_cache_used", "url": url, "file": str(path), "bytes": len(data)})
        return data
    except OSError as exc:
        print({"warning": "cvm_cache_read_failed", "url": url, "file": str(path), "error": str(exc)})
        return None


def write_cvm_cache(url: str, data: bytes) -> None:
    if not data:
        return
    path = cvm_cache_path(url)
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    except OSError as exc:
        print({"warning": "cvm_cache_write_failed", "url": url, "file": str(path), "error": str(exc)})


def cvm_get(url: str, *, timeout: int = 120, attempts: int = CVM_RETRY_ATTEMPTS) -> requests.Response | None:
    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            response = CVM_SESSION.get(url, timeout=timeout)
            if response.status_code == 404:
                print({"warning": "cvm_url_not_found", "url": url, "status_code": response.status_code})
                return None
            response.raise_for_status()
            return response
        except requests.RequestException as exc:
            last_error = exc
            wait_seconds = min(CVM_RETRY_BASE_SLEEP * attempt, 60)
            print({
                "warning": "cvm_download_retry",
                "attempt": attempt,
                "attempts": attempts,
                "wait_seconds": wait_seconds if attempt < attempts else 0,
                "url": url,
                "error": str(exc),
            })
            if attempt < attempts:
                time.sleep(wait_seconds)
    raise RuntimeError(f"Não foi possível acessar a CVM após {attempts} tentativas: {url}. Último erro: {last_error}") from last_error


def read_cvm_bytes(url: str, *, timeout: int = 120) -> bytes:
    try:
        response = cvm_get(url, timeout=timeout)
        if response is None:
            raise FileNotFoundError(f"Arquivo CVM não encontrado: {url}")
        write_cvm_cache(url, response.content)
        return response.content
    except Exception as exc:
        cached = read_cvm_cache(url)
        if cached is not None:
            print({"warning": "cvm_download_failed_using_cache", "url": url, "error": str(exc)})
            return cached
        raise


def read_cvm_csv(url: str) -> pd.DataFrame:
    data = read_cvm_bytes(url, timeout=120)
    return pd.read_csv(io.BytesIO(data), sep=";", encoding="latin1", dtype=str)


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [str(col).strip().upper() for col in df.columns]
    return df


def first_col(row: pd.Series | dict[str, Any], names: list[str]) -> Any:
    for name in names:
        if name in row and row.get(name) not in (None, ""):
            return row.get(name)
    return None


def load_assets(client: SupabaseRestClient, tickers: list[str]) -> list[dict[str, Any]]:
    base = {"select": "ticker,kind,name,company_name,cnpj,sector,industry,segment", "kind": "eq.fii", "limit": "10000"}
    if tickers:
        base["ticker"] = f"in.({','.join(tickers)})"
    return client.select("assets", base)


def read_latest_quotes(client: SupabaseRestClient, tickers: list[str]) -> dict[str, dict[str, Any]]:
    quotes: dict[str, dict[str, Any]] = {}
    for ticker in tickers:
        rows = client.select("asset_quotes", {"select": "ticker,price,market_cap,quote_date,updated_at", "ticker": f"eq.{ticker}", "order": "quote_date.desc.nullslast,updated_at.desc", "limit": "1"})
        if rows:
            quotes[ticker] = rows[0]
    return quotes


def match_cad(asset: dict[str, Any], cad: pd.DataFrame) -> dict[str, Any] | None:
    asset_cnpj = cnpj14(asset.get("cnpj"))
    if asset_cnpj:
        for col in ["CNPJ_FUNDO", "CNPJ_FDO", "CNPJ"]:
            if col in cad.columns:
                matched = cad[cad[col].astype(str).str.replace(r"\D", "", regex=True) == asset_cnpj]
                if not matched.empty:
                    out = matched.iloc[0].to_dict(); out["_match"] = "cnpj"; return out

    search_terms = [norm(asset.get("company_name")), norm(asset.get("name")), norm(asset.get("ticker"))]
    search_terms = [item for item in search_terms if item]
    if not search_terms:
        return None

    best: tuple[float, pd.Series] | None = None
    name_cols = [col for col in ["DENOM_SOCIAL", "DENOM_COMERC", "NM_FUNDO", "NOME_FUNDO"] if col in cad.columns]
    for _, row in cad.iterrows():
        names = [norm(row.get(col)) for col in name_cols]
        names = [item for item in names if item]
        if not names:
            continue
        score = 0.0
        for term in search_terms:
            for name in names:
                current = SequenceMatcher(None, term, name).ratio() * 100
                if term in name or name in term:
                    current = max(current, 92)
                score = max(score, current)
        if best is None or score > best[0]:
            best = (score, row)

    if not best or best[0] < 86:
        return None
    out = best[1].to_dict(); out["_match"] = f"name:{round(best[0], 2)}"; return out


def latest_info_by_cnpj(informes: list[pd.DataFrame]) -> dict[str, dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for df in informes:
        if df.empty:
            continue
        for _, row in df.iterrows():
            cnpj = cnpj14(first_col(row, ["CNPJ_FUNDO", "CNPJ_FDO", "CNPJ"]))
            dt = parse_date(first_col(row, ["DT_COMPTC", "DT_REFER", "DT_INFORMACAO"]))
            if not cnpj or not dt:
                continue
            item = row.to_dict()
            item["_cnpj"] = cnpj
            item["_dt"] = dt
            rows.append(item)

    rows.sort(key=lambda item: str(item.get("_dt") or ""), reverse=True)
    out: dict[str, dict[str, Any]] = {}
    for row in rows:
        cnpj = str(row["_cnpj"])
        if cnpj not in out:
            out[cnpj] = row
    return out


def latest_info_by_cnpj_year(informes: list[pd.DataFrame]) -> dict[str, dict[int, dict[str, Any]]]:
    """Retorna o informe mais recente de cada ano por CNPJ.

    Isso permite preencher séries anuais de FIIs, não só o ano corrente. Alguns
    FIIs possuem VP/Cota, PL e nº de cotas no informe diário da CVM, mas a rotina
    antiga só gravava o último informe disponível e deixava anos anteriores vazios.
    """
    rows: list[dict[str, Any]] = []
    for df in informes:
        if df.empty:
            continue
        for _, row in df.iterrows():
            cnpj = cnpj14(first_col(row, ["CNPJ_FUNDO", "CNPJ_FDO", "CNPJ"]))
            dt = parse_date(first_col(row, ["DT_COMPTC", "DT_REFER", "DT_INFORMACAO"]))
            if not cnpj or not dt:
                continue
            item = row.to_dict()
            item["_cnpj"] = cnpj
            item["_dt"] = dt
            item["_year"] = int(str(dt)[:4])
            rows.append(item)

    rows.sort(key=lambda item: str(item.get("_dt") or ""), reverse=True)
    out: dict[str, dict[int, dict[str, Any]]] = {}
    for row in rows:
        cnpj = str(row["_cnpj"])
        year = int(row["_year"])
        out.setdefault(cnpj, {})
        if year not in out[cnpj]:
            out[cnpj][year] = row
    return out


def build_asset_update(asset: dict[str, Any], cad_row: dict[str, Any] | None) -> dict[str, Any]:
    ticker = str(asset["ticker"]).upper()
    name = first_col(cad_row or {}, ["DENOM_SOCIAL", "DENOM_COMERC", "NM_FUNDO", "NOME_FUNDO"]) or asset.get("company_name") or asset.get("name") or ticker
    cnpj = cnpj14(first_col(cad_row or {}, ["CNPJ_FUNDO", "CNPJ_FDO", "CNPJ"])) or cnpj14(asset.get("cnpj"))
    return {
        "ticker": ticker,
        "kind": "fii",
        "name": asset.get("name") or name,
        "company_name": name,
        "cnpj": cnpj,
        "sector": "Fundos Imobiliários",
        "industry": asset.get("industry") or asset.get("segment") or "Fundo imobiliário",
        "segment": asset.get("segment") or asset.get("industry"),
        "currency": "BRL",
        "source": "CVM FII + fontes de mercado",
        "updated_at": now_iso(),
    }


def build_regulatory_rows(asset: dict[str, Any], cnpj: str | None, info: dict[str, Any] | None, quote: dict[str, Any] | None) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    if not info:
        return None, None
    ticker = str(asset["ticker"]).upper()
    reference_date = info.get("_dt") or parse_date(first_col(info, ["DT_COMPTC", "DT_REFER"])) or date.today().isoformat()
    reference_year = int(str(reference_date)[:4])
    pl = clean_number(first_col(info, ["VL_PATRIM_LIQ", "VL_PATRIMONIO_LIQ", "PATRIM_LIQ", "PATRIMONIO_LIQUIDO"]))
    quota = clean_number(first_col(info, ["VL_QUOTA", "VL_COTA", "VAL_QUOTA"]))
    total_assets = clean_number(first_col(info, ["VL_TOTAL", "VL_ATIVO", "ATIVO_TOTAL"])) or pl
    shares = None
    if quota and pl:
        shares = pl / quota
    cotistas = clean_number(first_col(info, ["NR_COTST", "NR_COTISTAS", "QTD_COTISTAS"]))
    price = clean_number((quote or {}).get("price"))
    market_cap = clean_number((quote or {}).get("market_cap"))
    if market_cap is None and price is not None and shares:
        market_cap = price * shares
    pvp = market_cap / pl if market_cap is not None and pl else None

    financial = None
    if pl is not None or total_assets is not None:
        financial = {
            "ticker": ticker,
            "period_type": "annual",
            "reference_year": reference_year,
            "reference_period": "FY",
            "reference_date": reference_date,
            "total_assets": total_assets,
            "equity": pl,
            "source": "CVM informe diário FII",
            "updated_at": now_iso(),
        }

    indicator = {
        "ticker": ticker,
        "reference_date": reference_date,
        "pvp": pvp,
        "market_cap": market_cap,
        "shares_outstanding": shares or cotistas,
        "vp_per_share": quota,
        "book_value_per_share": quota,
        "source": "CVM informe diário FII",
        "updated_at": now_iso(),
    }
    # Só grava indicador quando houver algum campo útil.
    if not any(indicator.get(key) is not None for key in ["pvp", "market_cap", "shares_outstanding", "vp_per_share", "book_value_per_share"]):
        indicator = None
    return financial, indicator


def default_years() -> list[int]:
    current = date.today().year
    return [current, current - 1]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Atualiza dados regulatórios de FIIs pela CVM.")
    parser.add_argument("--ticker", action="append", default=[], help="Ticker específico. Pode repetir.")
    parser.add_argument("--all", action="store_true", help="Atualiza todos os FIIs já cadastrados no Supabase.")
    parser.add_argument("--years", nargs="*", type=int, default=default_years(), help="Anos do informe diário de FIIs a carregar.")
    parser.add_argument("--strict", action="store_true", help="Falha o job se a CVM estiver indisponível.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    load_project_env()
    client = SupabaseRestClient(SupabaseConfig(url=get_required_env("SUPABASE_URL"), key=get_required_env("SUPABASE_SERVICE_ROLE_KEY")))

    tickers = [str(item).upper().replace(".SA", "") for item in args.ticker]
    assets = load_assets(client, tickers if tickers else [])
    if tickers:
        found = {str(asset.get("ticker") or "").upper() for asset in assets}
        for ticker in tickers:
            if ticker not in found:
                assets.append({"ticker": ticker, "kind": "fii", "name": ticker, "company_name": ticker})

    if not assets:
        print({"finished": True, "message": "Nenhum FII encontrado no Supabase para atualizar."})
        return 0

    try:
        cad = normalize_columns(read_cvm_csv(CVM_FII_CAD_URL))
    except Exception as exc:
        print({"warning": "cvm_fii_cad_unavailable", "error": str(exc)})
        if args.strict:
            raise
        cad = pd.DataFrame()

    informes: list[pd.DataFrame] = []
    for year in args.years:
        url = CVM_FII_INF_DIARIO_URL.format(year=year)
        try:
            informes.append(normalize_columns(read_cvm_csv(url)))
        except Exception as exc:
            print({"warning": "cvm_fii_informe_unavailable", "year": year, "error": str(exc)})
            if args.strict:
                raise
    latest_by_cnpj = latest_info_by_cnpj(informes)
    yearly_by_cnpj = latest_info_by_cnpj_year(informes)
    quotes = read_latest_quotes(client, [str(asset.get("ticker") or "").upper() for asset in assets])

    results: list[dict[str, Any]] = []
    for index, asset in enumerate(assets, start=1):
        ticker = str(asset.get("ticker") or "").upper()
        try:
            cad_row = match_cad(asset, cad) if not cad.empty else None
            asset_update = build_asset_update(asset, cad_row)
            cnpj = cnpj14(asset_update.get("cnpj"))
            info = latest_by_cnpj.get(cnpj or "")
            infos_by_year = yearly_by_cnpj.get(cnpj or "", {})
            if info and not infos_by_year:
                year = int(str(info.get("_dt") or date.today().isoformat())[:4])
                infos_by_year = {year: info}

            client.upsert("assets", asset_update, on_conflict="ticker")
            financial_count = 0
            indicator_count = 0
            for _, year_info in sorted(infos_by_year.items(), reverse=True):
                financial, indicator = build_regulatory_rows(asset_update, cnpj, year_info, quotes.get(ticker))
                if financial:
                    client.upsert("asset_financials", financial, on_conflict="ticker,period_type,reference_year,reference_period")
                    financial_count += 1
                if indicator:
                    client.upsert("asset_indicators", indicator, on_conflict="ticker,reference_date")
                    indicator_count += 1

            result = {
                "ticker": ticker,
                "ok": True,
                "cnpj": cnpj,
                "cad_match": bool(cad_row),
                "informe": bool(info),
                "years": sorted(infos_by_year.keys(), reverse=True),
                "financial": financial_count,
                "indicator": indicator_count,
            }
        except Exception as exc:
            result = {"ticker": ticker, "ok": False, "error": str(exc)}
        results.append(result)
        print({"progress": f"{index}/{len(assets)}", **result})

    REPORTS_DIR.mkdir(exist_ok=True)
    path = REPORTS_DIR / f"update-cvm-fiis-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}.json"
    path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print({
        "finished": True,
        "ok": sum(1 for item in results if item.get("ok")),
        "total": len(results),
        "with_cnpj": sum(1 for item in results if item.get("cnpj")),
        "with_informe": sum(1 for item in results if item.get("informe")),
        "financial_rows": sum(int(item.get("financial") or 0) for item in results),
        "indicator_rows": sum(int(item.get("indicator") or 0) for item in results),
        "report": str(path),
    })
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
