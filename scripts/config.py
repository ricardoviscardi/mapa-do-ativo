from __future__ import annotations

import os
from pathlib import Path

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    def load_dotenv(*_args, **_kwargs):
        return False


ROOT_DIR = Path(__file__).resolve().parents[1]


def load_project_env() -> None:
    """
    Carrega variáveis tanto de `.env` quanto de `.env.local`.

    Isso facilita rodar os scripts no mesmo projeto Next.js sem precisar duplicar
    chaves.
    """
    load_dotenv(ROOT_DIR / ".env")
    load_dotenv(ROOT_DIR / ".env.local", override=False)


def get_required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Variável de ambiente ausente: {name}")
    return value
