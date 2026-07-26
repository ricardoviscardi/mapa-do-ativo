from __future__ import annotations

import argparse
from config import get_required_env, load_project_env
from supabase_rest import SupabaseConfig, SupabaseRestClient


def count(client: SupabaseRestClient, table: str, ticker: str) -> int:
    return client.select_count(table, {"ticker": f"eq.{ticker}"})


def main() -> int:
    parser = argparse.ArgumentParser(description="Confere dados de um ativo no Supabase.")
    parser.add_argument("ticker")
    args = parser.parse_args()
    ticker = args.ticker.upper().replace(".SA", "")
    load_project_env()
    client = SupabaseRestClient(SupabaseConfig(url=get_required_env("SUPABASE_URL"), key=get_required_env("SUPABASE_SERVICE_ROLE_KEY")))

    asset = client.select("assets", {"select": "ticker,name,company_name,kind,sector,industry,updated_at", "ticker": f"eq.{ticker}", "limit": "1"})
    print({"ticker": ticker, "asset": asset[0] if asset else None})
    for table in ["asset_quotes", "asset_price_history", "asset_financials", "asset_indicators", "asset_dividends"]:
        print({"table": table, "count": count(client, table, ticker)})
    financial_sample = client.select("asset_financials", {"select": "ticker,period_type,reference_year,reference_period,reference_date,revenue,net_income,total_assets,equity", "ticker": f"eq.{ticker}", "order": "reference_date.desc", "limit": "12"})
    indicators_sample = client.select("asset_indicators", {"select": "ticker,reference_date,pe,pvp,dividend_yield,roe,roic,market_cap", "ticker": f"eq.{ticker}", "order": "reference_date.desc", "limit": "12"})
    print({"financial_sample": financial_sample})
    print({"indicators_sample": indicators_sample})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
