# v1.53.7 — Varredura de dados e saneamento da página de ações

Esta versão corrige a situação em que a base do Supabase existia, mas parte dos campos aparecia como "Não disponível" na página pública.

## Problema identificado

Depois que a atualização pesada foi migrada para GitHub Actions, algumas ações passaram a carregar dados parciais da base consolidada. Como o serviço retornava imediatamente o registro do Supabase, a página deixava de usar complementos que existiam nas versões anteriores.

Exemplo observado:

- Cotação e gráfico existiam.
- Indicadores-chave apareciam em grande parte vazios.
- Dividend Yield podia aparecer distorcido.
- Análise fundamentalista exibia poucas linhas.
- Alguns demonstrativos não apareciam visualmente, mesmo quando havia dados complementares disponíveis.

## Correção aplicada

- O serviço de ações agora detecta baixa completude dos dados.
- Quando necessário, complementa a resposta com dados públicos em tempo de execução.
- O Supabase continua sendo a base principal.
- Dados complementares só são usados para preencher lacunas.
- Dividend Yield fora de faixa plausível é bloqueado.
- A leitura fundamentalista foi ampliada para campos como P/L, P/VP, P/EBIT, EV/EBITDA, ROE, ROIC, margens, VPA, LPA e valor de mercado.

## Arquivos principais alterados

- `lib/stocks/stock-service.ts`
- `lib/stocks/fundamentus-client.ts`
- `lib/stocks/brapi-mapper.ts`
- `VERSAO.md`

## Validação sugerida

Testar localmente:

```text
http://localhost:3000/acoes/rail3
http://localhost:3000/acoes/petr3
http://localhost:3000/acoes/petr4
http://localhost:3000/acoes/pomo4
http://localhost:3000/acoes/abev3
http://localhost:3000/rankings
```

Também testar:

```text
http://localhost:3000/api/acoes/rail3
http://localhost:3000/api/data/asset/rail3
http://localhost:3000/api/data/quality
```
