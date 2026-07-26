# Ambientes do Mapa do Ativo

## Local

Serve para testar layout e páginas.

Pode usar:

```text
SUPABASE_WRITE_MODE=local_api
```

## GitHub Actions

Serve para atualizar dados, usando conexão direta:

```text
SUPABASE_WRITE_MODE=direct
```

Secrets necessários:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

## Vercel

Servirá para publicar o site.

Não usar em produção:

```text
LOCAL_PROXY_INSECURE_TLS=true
```
