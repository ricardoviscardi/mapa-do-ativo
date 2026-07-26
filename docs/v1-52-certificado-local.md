# v1.52 — Correção de certificado local

## Erro

```text
unable to get local issuer certificate
```

Esse erro indica que o ambiente local está interceptando ou bloqueando a cadeia de certificado TLS. Pode ser antivírus, proxy, VPN, rede corporativa ou certificado raiz ausente no Node/Windows.

## Correção aplicada

A v1.52 permite, apenas em desenvolvimento local:

```text
LOCAL_PROXY_INSECURE_TLS=true
```

Com isso, o proxy local do Next consegue prosseguir mesmo quando o certificado local não é reconhecido.

## Importante

Não use essa configuração em produção.

Antes de deploy, deixe:

```text
LOCAL_PROXY_INSECURE_TLS=false
```

ou remova a variável.

## Como testar

1. Confirme no `.env.local`:

```text
LOCAL_PROXY_INSECURE_TLS=true
```

2. Pare e reinicie o servidor:

```text
Ctrl + C
npm run dev
```

3. Em outro PowerShell:

```bash
python scripts/check_supabase_connection.py
```

O esperado é:

```text
proxy_status: 200
ok: True
```
