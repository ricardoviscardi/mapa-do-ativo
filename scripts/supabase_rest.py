from __future__ import annotations

import math
import os
from dataclasses import dataclass
from typing import Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


def _json_safe(value: Any) -> Any:
    """Converte NaN/Infinity em None antes de enviar JSON ao Supabase.

    Alguns provedores financeiros retornam floats especiais. O módulo json
    usado pelo requests rejeita esses valores com "Out of range float values
    are not JSON compliant", interrompendo toda a atualização de um ticker.
    """
    if isinstance(value, float):
        return value if math.isfinite(value) else None
    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    return value


@dataclass(frozen=True)
class SupabaseConfig:
    url: str
    key: str

    @property
    def rest_url(self) -> str:
        return f"{self.url.rstrip('/')}/rest/v1"


def _build_session() -> requests.Session:
    session = requests.Session()
    retries = Retry(
        total=4,
        connect=4,
        read=4,
        status=4,
        backoff_factor=1.5,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset(["GET", "POST", "PATCH", "DELETE"]),
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retries, pool_connections=10, pool_maxsize=10)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


class SupabaseRestClient:
    def __init__(self, config: SupabaseConfig) -> None:
        self.config = config
        self.mode = os.getenv("SUPABASE_WRITE_MODE", "").strip().lower()
        self.local_api_url = os.getenv("LOCAL_UPDATE_API_URL", "http://localhost:3000/api/internal/supabase-proxy").strip()
        self.internal_token = os.getenv("INTERNAL_UPDATE_TOKEN", "dev-local-update-token").strip()
        self.session = _build_session()

        self.session.headers.update({
            "apikey": config.key,
            "Authorization": f"Bearer {config.key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
            "User-Agent": "MapaDoAtivoDataUpdater/1.48",
        })

    @property
    def use_local_api(self) -> bool:
        return self.mode in {"local_api", "local", "next_proxy"}

    def _local_call(self, payload: dict[str, Any]) -> dict[str, Any]:
        try:
            response = requests.post(
                self.local_api_url,
                headers={
                    "Content-Type": "application/json",
                    "x-internal-token": self.internal_token,
                },
                json=payload,
                timeout=180,
            )
        except requests.exceptions.ConnectionError as exc:
            raise RuntimeError(
                "Não consegui conectar ao proxy local do Next.js. "
                "Deixe `npm run dev` rodando em outro PowerShell e tente novamente. "
                f"Detalhe: {exc}"
            ) from exc

        if response.status_code not in (200, 201, 204):
            raise RuntimeError(
                f"Proxy local respondeu HTTP {response.status_code}: {response.text[:1000]}"
            )

        data = response.json() if response.text else {}
        if not data.get("ok", False):
            raise RuntimeError(f"Proxy local retornou erro: {data}")

        return data

    def _request(self, method: str, url: str, *, timeout: int = 90, **kwargs: Any) -> requests.Response:
        try:
            return self.session.request(method, url, timeout=timeout, **kwargs)
        except requests.exceptions.SSLError as exc:
            raise RuntimeError(
                "Falha SSL/TLS ao conectar ao Supabase via Python. "
                "Use o modo local_api, mantendo `npm run dev` aberto, ou atualize certifi/requests/urllib3. "
                f"Detalhe técnico: {exc}"
            ) from exc
        except requests.exceptions.ConnectionError as exc:
            raise RuntimeError(
                "Falha de conexão com Supabase. Verifique internet, VPN/proxy/firewall e tente novamente. "
                f"Detalhe técnico: {exc}"
            ) from exc

    def select(self, table: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        if self.use_local_api:
            data = self._local_call({"op": "select", "table": table, "params": params or {}})
            payload = data.get("data", [])
            return payload if isinstance(payload, list) else []

        response = self._request("GET", f"{self.config.rest_url}/{table}", params=params or {})
        if response.status_code not in (200, 206):
            raise RuntimeError(f"Erro ao ler {table}: HTTP {response.status_code} - {response.text[:1000]}")
        payload = response.json()
        return payload if isinstance(payload, list) else []

    def upsert(self, table: str, rows: list[dict[str, Any]] | dict[str, Any], on_conflict: str | None = None) -> None:
        if isinstance(rows, dict):
            rows = [rows]
        if not rows:
            return

        rows = _json_safe(rows)

        if self.use_local_api:
            self._local_call({"op": "upsert", "table": table, "rows": rows, "on_conflict": on_conflict})
            return

        response = self._request(
            "POST",
            f"{self.config.rest_url}/{table}",
            params={"on_conflict": on_conflict} if on_conflict else None,
            headers={"Prefer": "resolution=merge-duplicates,return=minimal"},
            json=rows,
            timeout=120,
        )
        if response.status_code not in (200, 201, 204):
            raise RuntimeError(f"Erro ao gravar em {table}: HTTP {response.status_code} - {response.text[:1000]}")

    def delete_matching(self, table: str, filters: dict[str, str]) -> None:
        if self.use_local_api:
            self._local_call({"op": "delete", "table": table, "filters": filters})
            return

        response = self._request("DELETE", f"{self.config.rest_url}/{table}", params=filters)
        if response.status_code not in (200, 202, 204):
            raise RuntimeError(f"Erro ao apagar em {table}: HTTP {response.status_code} - {response.text[:1000]}")

    def select_count(self, table: str, filters: dict[str, str] | None = None) -> int:
        params = {"select": "id", "limit": "1", **(filters or {})}

        if self.use_local_api:
            data = self._local_call({"op": "count", "table": table, "filters": filters or {}})
            count = data.get("count", 0)
            return int(count) if isinstance(count, (int, float)) else 0

        response = self._request(
            "GET",
            f"{self.config.rest_url}/{table}",
            params=params,
            headers={"Prefer": "count=exact"},
            timeout=30,
        )
        if response.status_code not in (200, 206):
            raise RuntimeError(f"Erro ao ler {table}: HTTP {response.status_code} - {response.text[:1000]}")
        content_range = response.headers.get("content-range", "")
        if "/" in content_range:
            try:
                return int(content_range.split("/")[-1])
            except ValueError:
                return 0
        return 0
