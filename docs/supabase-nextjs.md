# Conexão Next.js + Supabase

## Variáveis configuradas

A v1.31 lê o Supabase por REST no servidor, sem depender de biblioteca extra.

Variáveis usadas:

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_ANON_KEY=
```

A chave enviada no chat começa com `sb_publishable_`. Por isso ela foi configurada como chave publicável/anon.
Ela serve para validar leitura e conexão, especialmente com RLS desativado.

Para atualizar dados via scripts Python e GitHub Actions, o ideal será usar uma chave `secret` ou `service_role` real.

## Rotas de teste

```text
/api/data/status
/api/data/asset/petr4
```

## Fluxo de dados do site

A partir da v1.31, a página do ativo tenta ler nesta ordem:

```text
1. Supabase
2. brapi/Yahoo/Fundamentus público como fallback temporário
```

Se as tabelas do Supabase estiverem vazias, o site continua funcionando pelo fallback atual.
Quando os scripts Python começarem a popular as tabelas, o site passa a usar os dados próprios primeiro.
