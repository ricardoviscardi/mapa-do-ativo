"""
v1.41 - Atualização em massa da base inicial do Mapa do Ativo.

Este script usa a mesma rotina de coleta do `update_prices_yahoo.py`, mas foi
criado para popular uma base maior de ações e FIIs com controle de lote,
pausa entre requisições e relatório final.

Exemplos:
    python scripts/update_base_inicial.py --core
    python scripts/update_base_inicial.py --all
    python scripts/update_base_inicial.py --stocks
    python scripts/update_base_inicial.py --fiis
    python scripts/update_base_inicial.py --all --limit 20
"""

from __future__ import annotations

import argparse
import csv
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from config import ROOT_DIR, get_required_env, load_project_env
from supabase_rest import SupabaseConfig, SupabaseRestClient
from tickers import ALL_TICKERS, CORE_TICKERS, FII_TICKERS, STOCK_TICKERS
from b3_universe import load_b3_stock_tickers, load_b3_fii_tickers
from update_prices_yahoo import update_one


def now_slug() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Atualiza a base inicial do Mapa do Ativo em massa.")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--core", action="store_true", help="Atualiza apenas a lista principal validada.")
    group.add_argument("--all", action="store_true", help="Atualiza ações e FIIs da base ampliada.")
    group.add_argument("--stocks", action="store_true", help="Atualiza apenas ações da base ampliada.")
    group.add_argument("--b3-stocks", action="store_true", help="Atualiza universo amplo/dinâmico de ações da B3.")
    group.add_argument("--fiis", action="store_true", help="Atualiza apenas FIIs da base ampliada.")
    group.add_argument("--b3-fiis", action="store_true", help="Atualiza universo amplo/dinâmico de FIIs da B3.")
    parser.add_argument("--limit", type=int, default=None, help="Limita a quantidade de ativos processados.")
    parser.add_argument("--start-from", type=str, default=None, help="Começa a partir de um ticker específico.")
    parser.add_argument("--sleep", type=float, default=1.0, help="Pausa em segundos entre ativos.")
    return parser


def select_tickers(args: argparse.Namespace) -> list[str]:
    if args.b3_stocks:
        tickers = load_b3_stock_tickers()
    elif args.stocks:
        tickers = STOCK_TICKERS
    elif args.fiis:
        tickers = FII_TICKERS
    elif args.b3_fiis:
        tickers = load_b3_fii_tickers()
    elif args.all:
        tickers = ALL_TICKERS
    else:
        tickers = CORE_TICKERS

    if args.start_from:
        normalized = args.start_from.upper().replace(".SA", "")
        if normalized in tickers:
            tickers = tickers[tickers.index(normalized):]

    if args.limit:
        tickers = tickers[: args.limit]

    return tickers


def write_reports(results: list[dict[str, Any]]) -> tuple[Path, Path]:
    reports_dir = ROOT_DIR / "reports"
    reports_dir.mkdir(exist_ok=True)
    slug = now_slug()
    json_path = reports_dir / f"update-base-{slug}.json"
    csv_path = reports_dir / f"update-base-{slug}.csv"

    json_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")

    keys = [
        "ticker", "ok", "history_rows", "dividend_rows", "financial_rows",
        "indicator_rows", "price", "market_cap", "message", "error",
    ]
    with csv_path.open("w", encoding="utf-8", newline="") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=keys, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(results)

    return json_path, csv_path


def main() -> int:
    args = build_parser().parse_args()
    load_project_env()

    client = SupabaseRestClient(
        SupabaseConfig(
            url=get_required_env("SUPABASE_URL"),
            key=get_required_env("SUPABASE_SERVICE_ROLE_KEY"),
        )
    )

    tickers = select_tickers(args)
    results: list[dict[str, Any]] = []

    print({"starting": True, "total": len(tickers), "sleep": args.sleep})

    for index, ticker in enumerate(tickers, start=1):
        try:
            result = update_one(client, ticker)
        except Exception as exc:
            result = {"ticker": ticker, "ok": False, "error": str(exc)}

        results.append(result)
        print({"progress": f"{index}/{len(tickers)}", **result})

        if args.sleep and index < len(tickers):
            time.sleep(args.sleep)

    json_path, csv_path = write_reports(results)
    ok_count = sum(1 for item in results if item.get("ok"))
    fail_count = len(results) - ok_count

    print({
        "finished": True,
        "ok": ok_count,
        "fail": fail_count,
        "total": len(results),
        "assets_count": client.select_count("assets"),
        "history_count": client.select_count("asset_price_history"),
        "financial_count": client.select_count("asset_financials"),
        "indicator_count": client.select_count("asset_indicators"),
        "dividend_count": client.select_count("asset_dividends"),
        "report_json": str(json_path),
        "report_csv": str(csv_path),
    })

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
