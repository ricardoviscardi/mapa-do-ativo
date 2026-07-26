from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from config import get_required_env, load_project_env
from supabase_rest import SupabaseConfig, SupabaseRestClient

ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT_DIR / "public" / "data" / "snapshots" / "stocks"


def normalize_ticker(value: str) -> str:
    return "".join(ch for ch in value.upper().strip().replace(".SA", "") if ch.isalnum())


def select_all(client: SupabaseRestClient, table: str, params: dict[str, Any], page_size: int = 1000, max_rows: int | None = None) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    offset = 0
    while True:
        limit = page_size if max_rows is None else min(page_size, max_rows - len(rows))
        if limit <= 0:
            break
        batch = client.select(table, {**params, "limit": str(limit), "offset": str(offset)})
        rows.extend(batch)
        if len(batch) < limit:
            break
        offset += limit
    return rows


def get_tickers(client: SupabaseRestClient, tickers: list[str], all_stocks: bool, all_fiis: bool, all_assets: bool) -> list[str]:
    if tickers:
        return sorted({normalize_ticker(t) for t in tickers if normalize_ticker(t)})

    if not (all_stocks or all_fiis or all_assets):
        raise RuntimeError("Informe ao menos --ticker, --all-stocks, --all-fiis ou --all-assets.")

    params = {
        "select": "ticker",
        "order": "ticker.asc",
    }
    if all_stocks and not all_assets:
        params["kind"] = "eq.stock"
    if all_fiis and not all_assets:
        params["kind"] = "eq.fii"

    assets = select_all(client, "assets", params, page_size=1000)
    return [normalize_ticker(row.get("ticker", "")) for row in assets if row.get("ticker")]


def export_ticker(client: SupabaseRestClient, ticker: str, output_dir: Path, limit_history: int) -> dict[str, Any] | None:
    assets = client.select("assets", {
        "select": "*",
        "ticker": f"eq.{ticker}",
        "limit": "1",
    })
    if not assets:
        print({"ticker": ticker, "ok": False, "message": "Ativo não encontrado em assets."})
        return None

    quotes = client.select("asset_quotes", {
        "select": "*",
        "ticker": f"eq.{ticker}",
        "order": "quote_date.desc",
        "limit": "1",
    })
    history = select_all(client, "asset_price_history", {
        "select": "date,close,volume,source",
        "ticker": f"eq.{ticker}",
        "order": "date.desc",
    }, page_size=1000, max_rows=limit_history)
    financials = client.select("asset_financials", {
        "select": "*",
        "ticker": f"eq.{ticker}",
        "order": "reference_date.desc",
        "limit": "160",
    })
    dividends = client.select("asset_dividends", {
        "select": "*",
        "ticker": f"eq.{ticker}",
        "order": "payment_date.desc",
        "limit": "400",
    })
    indicators = client.select("asset_indicators", {
        "select": "*",
        "ticker": f"eq.{ticker}",
        "order": "reference_date.desc",
        "limit": "120",
    })

    payload = {
        "version": "v1.53.33",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "ticker": ticker,
        "asset": assets[0],
        "quotes": quotes,
        "historyRows": history,
        "financials": financials,
        "dividendRows": dividends,
        "indicatorRows": indicators,
    }

    output_dir.mkdir(parents=True, exist_ok=True)
    file_path = output_dir / f"{ticker}.json"
    file_path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    summary = {
        "ticker": ticker,
        "ok": True,
        "quotes": len(quotes),
        "history": len(history),
        "financials": len(financials),
        "dividends": len(dividends),
        "indicators": len(indicators),
        "file": str(file_path),
    }
    print(summary)
    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description="Exporta snapshot de dados do Supabase para testes em redes bloqueadas e publicação no repositório.")
    parser.add_argument("--ticker", action="append", default=[], help="Ticker específico. Pode ser usado várias vezes.")
    parser.add_argument("--all-stocks", action="store_true", help="Exporta todas as ações cadastradas em assets.kind=stock.")
    parser.add_argument("--all-fiis", action="store_true", help="Exporta todos os FIIs cadastrados em assets.kind=fii.")
    parser.add_argument("--all-assets", action="store_true", help="Exporta ações e FIIs cadastrados em assets.")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="Pasta de saída dos JSONs.")
    parser.add_argument("--limit-history", type=int, default=2600, help="Máximo de linhas de histórico por ativo.")
    args = parser.parse_args()

    load_project_env()
    client = SupabaseRestClient(SupabaseConfig(
        url=get_required_env("SUPABASE_URL"),
        key=get_required_env("SUPABASE_SERVICE_ROLE_KEY"),
    ))

    output_dir = Path(args.output)
    tickers = get_tickers(client, args.ticker, args.all_stocks, args.all_fiis, args.all_assets)
    summaries = []
    for index, ticker in enumerate(tickers, start=1):
        print({"progress": f"{index}/{len(tickers)}", "ticker": ticker})
        summary = export_ticker(client, ticker, output_dir, args.limit_history)
        if summary:
            summaries.append(summary)

    index_payload = {
        "version": "v1.53.33",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "total": len(summaries),
        "tickers": [item["ticker"] for item in summaries],
        "items": summaries,
    }
    output_dir.parent.mkdir(parents=True, exist_ok=True)
    (output_dir.parent / "index.json").write_text(json.dumps(index_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print({"finished": True, "total": len(summaries), "output": str(output_dir)})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
