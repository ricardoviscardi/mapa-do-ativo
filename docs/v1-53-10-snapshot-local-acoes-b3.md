# v1.53.10 — Snapshot local para ações em redes com bloqueio Supabase

Esta versão corrige a etapa de desenvolvimento local quando a rede bloqueia o domínio do Supabase via OpenDNS/Cisco Umbrella.

## Problema identificado

O endpoint `/api/data/status` retornava `connected: false` com redirecionamento para `malware.opendns.com`. Nessa situação, a página local não consegue acessar as tabelas completas do Supabase:

- assets
- asset_quotes
- asset_price_history
- asset_financials
- asset_dividends
- asset_indicators

Sem essas tabelas, a tela passa a usar complementos públicos/parciais. Isso explica indicadores pobres, DRE/Balanço/Fluxo com apenas coluna atual e ausência de anos anteriores.

## Solução adicionada

Foi criado um modo de snapshot local:

```text
public/data/snapshots/index.json
public/data/snapshots/stocks/<TICKER>.json
```

Quando o Supabase estiver bloqueado localmente, a página tenta ler esse snapshot antes de cair em dados complementares.

## Como gerar o snapshot

O workflow `Atualizar ações` agora gera um artifact chamado:

```text
snapshot-local-acoes
```

Depois de rodar a Action com:

```text
modo: completo_com_itr
universo: todas_acoes_b3
```

baixe esse artifact, extraia e copie a pasta `data/snapshots` para dentro de `public/` no projeto local.

O caminho final deve ficar assim:

```text
public/data/snapshots/index.json
public/data/snapshots/stocks/LREN3.json
public/data/snapshots/stocks/PETR4.json
```

Depois reinicie o Next.js e teste:

```text
http://localhost:3000/api/data/status
http://localhost:3000/api/data/asset/lren3
http://localhost:3000/acoes/lren3
```

