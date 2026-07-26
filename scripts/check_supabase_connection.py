from __future__ import annotations

import os
import requests

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

    mode = os.getenv("SUPABASE_WRITE_MODE", "direct")
    local_url = os.getenv("LOCAL_UPDATE_API_URL", "http://localhost:3000/api/internal/supabase-proxy")

    print({"mode": mode, "local_api": client.use_local_api, "LOCAL_PROXY_INSECURE_TLS": os.getenv("LOCAL_PROXY_INSECURE_TLS")})

    if client.use_local_api:
        status = requests.get(local_url, timeout=30)
        print({"proxy_status": status.status_code, "proxy_body": status.text[:500]})

        if status.status_code == 404:
          raise RuntimeError(
              "O proxy local ainda não foi encontrado. Pare o npm run dev com Ctrl+C, "
              "substitua a pasta pela v1.50 e rode npm run dev de novo."
          )

    rows = client.select("assets", {"select": "ticker", "limit": "1"})
    print({"ok": True, "sample": rows[:1], "assets_count": client.select_count("assets")})

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
