# v1.48 — Proxy local Next.js para evitar erro SSL do Python

## Problema

O Python no Windows falhou ao conectar no Supabase com:

```text
[SSL: SSLV3_ALERT_HANDSHAKE_FAILURE]
```

Como o site em Next.js já consegue consultar o Supabase, esta versão permite que os scripts Python gravem em:

```text
http://localhost:3000/api/internal/supabase-proxy
```

O Next.js recebe localmente e faz a ponte com o Supabase.

## Como usar

1. Em um PowerShell, rode o site:

```bash
npm run dev
```

2. Em outro PowerShell, ative a venv:

```bash
.venv\Scripts\activate
```

3. Teste conexão:

```bash
python scripts/check_supabase_connection.py
```

4. Rode atualização:

```bash
python scripts/update_all_stocks_full.py --with-itr
```

## Variáveis necessárias no `.env.local`

```text
SUPABASE_WRITE_MODE=local_api
LOCAL_UPDATE_API_URL=http://localhost:3000/api/internal/supabase-proxy
INTERNAL_UPDATE_TOKEN=dev-local-update-token
```

O mesmo token é usado pelo Python e pelo Next.js local.
