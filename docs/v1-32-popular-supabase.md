# v1.32 — Popular Supabase com Yahoo/yfinance

## Objetivo

Fazer o Mapa do Ativo começar a usar uma base própria para dados de preço e histórico.

## O que esta versão popula

- `assets`
- `asset_quotes`
- `asset_price_history`
- `asset_indicators` parcialmente

## Como rodar

1. Instale dependências Python:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

2. Rode atualização:

```bash
python scripts/update_prices_yahoo.py
```

3. Confira no navegador:

```text
http://localhost:3000/api/data/status
http://localhost:3000/api/data/asset/petr4
http://localhost:3000/acoes/petr4
```

## Se der erro de permissão

A chave que começa com `sb_publishable` pode servir para leitura, mas pode não gravar dependendo da configuração do Supabase.

Para scripts de gravação, use a chave `service_role`/secret do Supabase:

```text
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_real
```

## Próxima etapa

v1.33: começar a popular fundamentos de ações via CVM DFP/ITR.
