# v1.49 — Proxy Node HTTPS

## Correção

A v1.48 criou o proxy local, mas ele ainda usava `fetch`. No seu ambiente, o `fetch` do Next retornou:

```text
{"ok":false,"message":"fetch failed"}
```

A v1.49 troca o proxy interno para `node:https`, forçando:

- runtime Node.js;
- IPv4;
- TLS 1.2;
- erro mais detalhado.

## Como rodar

1. Em um PowerShell:

```bash
npm run dev
```

Se ainda falhar, rode assim:

```powershell
$env:NODE_OPTIONS="--dns-result-order=ipv4first"
npm run dev
```

2. Em outro PowerShell:

```bash
.venv\Scripts\activate
python scripts/check_supabase_connection.py
```

3. Se ok:

```bash
python scripts/update_all_stocks_full.py --with-itr
```
