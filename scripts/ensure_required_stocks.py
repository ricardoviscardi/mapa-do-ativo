from __future__ import annotations

import argparse
from datetime import datetime, timezone
from typing import Any

from config import get_required_env, load_project_env
from supabase_rest import SupabaseConfig, SupabaseRestClient
from update_prices_yahoo import update_one
from ticker_aliases import resolve_current_ticker

REQUIRED_STOCKS: dict[str, dict[str, str | None]] = {
    "PETR3": {"name": "PETROBRAS ON", "company_name": "PETROLEO BRASILEIRO S.A. PETROBRAS", "sector": "Petróleo e gás", "industry": "Exploração e produção de petróleo e gás"},
    "PETR4": {"name": "PETROBRAS PN", "company_name": "PETROLEO BRASILEIRO S.A. PETROBRAS", "sector": "Petróleo e gás", "industry": "Exploração e produção de petróleo e gás"},
    "ABEV3": {"name": "AMBEV ON", "company_name": "AMBEV S.A.", "sector": "Consumo defensivo", "industry": "Bebidas"},
    "LREN3": {"name": "LOJAS RENNER ON", "company_name": "LOJAS RENNER S.A.", "sector": "Consumo cíclico", "industry": "Varejo"},
    "RENT3": {"name": "LOCALIZA ON", "company_name": "LOCALIZA RENT A CAR S.A.", "sector": "Consumo cíclico", "industry": "Aluguel e leasing"},
    "CMIG4": {"name": "CEMIG PN", "company_name": "COMPANHIA ENERGETICA DE MINAS GERAIS", "sector": "Serviços de utilidade pública", "industry": "Energia elétrica"},
    "SUZB3": {"name": "SUZANO ON", "company_name": "SUZANO S.A.", "sector": "Materiais básicos", "industry": "Papel e celulose"},
    "WEGE3": {"name": "WEG ON", "company_name": "WEG S.A.", "sector": "Indústria", "industry": "Equipamentos elétricos"},
    "MGLU3": {"name": "MAGAZINE LUIZA ON", "company_name": "MAGAZINE LUIZA S.A.", "sector": "Consumo cíclico", "industry": "Varejo"},
    "NATU3": {"name": "NATURA ON", "company_name": "NATURA COSMETICOS S.A.", "sector": "Consumo defensivo", "industry": "Produtos de uso pessoal e doméstico"},
    "WIZC3": {"name": "WIZ CO ON", "company_name": "WIZ CO PARTICIPACOES E CORRETAGEM DE SEGUROS S.A.", "sector": "Financeiro", "industry": "Corretagem de seguros"},
    "EMBJ3": {"name": "EMBRAER ON", "company_name": "EMBRAER S.A.", "sector": "Indústria", "industry": "Aeroespacial e defesa"},
    "TOTS3": {"name": "TOTVS ON", "company_name": "TOTVS S.A.", "sector": "Tecnologia", "industry": "Software"},
    "AXIA3": {"name": "AXIA ENERGIA ON", "company_name": "AXIA ENERGIA S.A.", "sector": "Serviços de utilidade pública", "industry": "Energia elétrica"},
    "MBRF3": {"name": "MBRF ON", "company_name": "MBRF GLOBAL FOODS COMPANY S.A.", "sector": "Consumo defensivo", "industry": "Alimentos"},
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_ticker(value: str) -> str:
    cleaned = "".join(ch for ch in value.upper().replace(".SA", "") if ch.isalnum())
    return resolve_current_ticker(cleaned)


def select_count(client: SupabaseRestClient, table: str, ticker: str) -> int:
    return client.select_count(table, {"ticker": f"eq.{ticker}"})


def upsert_skeleton_asset(client: SupabaseRestClient, ticker: str) -> None:
    meta = REQUIRED_STOCKS.get(ticker, {})
    client.upsert(
        "assets",
        {
            "ticker": ticker,
            "kind": "stock",
            "name": meta.get("name") or ticker,
            "company_name": meta.get("company_name") or meta.get("name") or ticker,
            "sector": meta.get("sector"),
            "industry": meta.get("industry"),
            "currency": "BRL",
            "source": "fallback-cadastro-publicavel",
            "updated_at": now_iso(),
        },
        on_conflict="ticker",
    )


def ensure_one(client: SupabaseRestClient, ticker: str) -> dict[str, Any]:
    ticker = normalize_ticker(ticker)
    update_result: dict[str, Any]
    try:
        update_result = update_one(client, ticker)
    except Exception as exc:
        update_result = {"ticker": ticker, "ok": False, "error": str(exc)}

    # Mesmo quando preço/histórico falha, o ativo precisa existir para a etapa CVM
    # conseguir associar o ticker ao cadastro e gravar balanço/DRE/fluxo.
    # Mas não sobrescrevemos dados bons quando Yahoo/BRAPI atualizou com sucesso.
    if not update_result.get("ok"):
        existing = client.select("assets", {"select": "ticker", "ticker": f"eq.{ticker}", "limit": "1"})
        if not existing:
            upsert_skeleton_asset(client, ticker)

    history_count = select_count(client, "asset_price_history", ticker)
    quote_count = select_count(client, "asset_quotes", ticker)
    financial_count = select_count(client, "asset_financials", ticker)
    indicator_count = select_count(client, "asset_indicators", ticker)

    return {
        "ticker": ticker,
        "update_ok": bool(update_result.get("ok")),
        "update_result": update_result,
        "history_count": history_count,
        "quote_count": quote_count,
        "financial_count": financial_count,
        "indicator_count": indicator_count,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Garante cadastro e tenta atualizar tickers críticos para publicação.")
    parser.add_argument("--ticker", action="append", default=[], help="Ticker específico. Pode repetir.")
    parser.add_argument("--strict-history", action="store_true", help="Falha se algum ticker ficar sem histórico mínimo.")
    parser.add_argument("--min-history", type=int, default=200)
    args = parser.parse_args()

    load_project_env()
    client = SupabaseRestClient(
        SupabaseConfig(
            url=get_required_env("SUPABASE_URL"),
            key=get_required_env("SUPABASE_SERVICE_ROLE_KEY"),
        )
    )

    tickers = [normalize_ticker(t) for t in args.ticker] if args.ticker else list(REQUIRED_STOCKS)
    results = [ensure_one(client, ticker) for ticker in tickers]

    print({"stage": "ensure_required_stocks", "results": results})

    failed_history = [item for item in results if int(item.get("history_count") or 0) < args.min_history]
    if args.strict_history and failed_history:
        print({
            "ok": False,
            "message": "Tickers críticos ainda sem histórico mínimo. Confira BRAPI_API_TOKEN e disponibilidade das fontes.",
            "failed": failed_history,
        })
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
