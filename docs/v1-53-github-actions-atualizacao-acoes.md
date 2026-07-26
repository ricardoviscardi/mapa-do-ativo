# v1.53 — GitHub Actions para atualização de ações

## Motivo

A rede local bloqueou o domínio do Supabase via OpenDNS/Cisco Umbrella. Por isso, a atualização de dados passa a rodar fora da rede da empresa.

## Workflows

```text
.github/workflows/update-acoes.yml
.github/workflows/update-cvm-semanal.yml
```

## Modos manuais

- `precos`
- `cvm`
- `completo_sem_itr`
- `completo_com_itr`

## Secrets

Obrigatórios:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Opcional:

```text
BRAPI_API_TOKEN
```

## Observação

A service_role nunca deve ficar no código. Use apenas `.env.local`, GitHub Secrets e, futuramente, Vercel Environment Variables.
