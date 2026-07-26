from __future__ import annotations

from config import get_required_env, load_project_env
from supabase_rest import SupabaseConfig, SupabaseRestClient


def main() -> int:
    load_project_env()

    client = SupabaseRestClient(
        SupabaseConfig(
            url=get_required_env("SUPABASE_URL"),
            key=get_required_env("SUPABASE_SERVICE_ROLE_KEY"),
        )
    )

    tables = [
        "assets",
        "asset_quotes",
        "asset_price_history",
        "asset_financials",
        "asset_dividends",
        "asset_indicators",
    ]

    for table in tables:
        print({
            "table": table,
            "count": client.select_count(table),
        })

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
