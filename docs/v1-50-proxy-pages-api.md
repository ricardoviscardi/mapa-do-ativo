# v1.50 — Proxy local por Pages API

## O que aconteceu

O teste retornou:

```text
proxy_status: 404
```

Isso significa que o endpoint do proxy não foi carregado pelo servidor local do Next.

## Correção

A v1.50 remove o proxy em `app/api` e cria o mesmo endpoint em:

```text
pages/api/internal/supabase-proxy.ts
```

Esse formato é mais compatível com o servidor local quando ele está resolvendo API por Pages Router.

## Como testar

1. Pare o servidor:

```text
Ctrl + C
```

2. Rode novamente:

```bash
npm run dev
```

3. Em outro PowerShell:

```bash
.venv\Scripts\activate
python scripts/check_supabase_connection.py
```

O esperado é:

```text
proxy_status: 200
```
