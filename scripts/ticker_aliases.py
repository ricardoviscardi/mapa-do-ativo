from __future__ import annotations

import re
from typing import Any

# Tickers que deixaram de ser os códigos principais na B3.
# Mantemos a lista para aceitar busca/inputs antigos, mas processar/exportar
# sempre o ticker atual. Isso evita snapshots vazios de códigos que as fontes
# públicas deixaram de retornar.
TICKER_ALIASES: dict[str, str] = {
    "NTCO3": "NATU3",
    "EMBR3": "EMBJ3",
    "ELET3": "AXIA3",
    "ELET5": "AXIA5",
    "ELET6": "AXIA6",
    "BRFS3": "MBRF3",
    "MRFG3": "MBRF3",
}

TICKER_ALIAS_REASONS: dict[str, str] = {
    "NTCO3": "Natura passou a negociar como NATU3.",
    "EMBR3": "Embraer passou a negociar como EMBJ3.",
    "ELET3": "Eletrobras/Axia passou a negociar como AXIA3.",
    "ELET5": "Eletrobras/Axia passou a negociar como AXIA5.",
    "ELET6": "Eletrobras/Axia passou a negociar como AXIA6.",
    "BRFS3": "BRF/Marfrig passaram a negociar como MBRF3.",
    "MRFG3": "Marfrig/BRF passaram a negociar como MBRF3.",
}


def normalize_ticker_code(value: Any) -> str:
    return re.sub(r"[^A-Z0-9]", "", str(value or "").upper().replace(".SA", ""))


def resolve_current_ticker(value: Any) -> str:
    normalized = normalize_ticker_code(value)
    return TICKER_ALIASES.get(normalized, normalized)


def is_legacy_ticker(value: Any) -> bool:
    return normalize_ticker_code(value) in TICKER_ALIASES
