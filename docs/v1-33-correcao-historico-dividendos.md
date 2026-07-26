# v1.33 — Correção do histórico Supabase + dividendos Yahoo

## Problema encontrado

O Supabase REST retorna por padrão no máximo 1.000 linhas por consulta. Como o histórico de 10 anos tem mais de 2.000 pregões por ativo, a versão anterior podia trazer apenas os primeiros registros do histórico.

Isso fazia o gráfico e as oscilações usarem preço atual de 2026 com histórico antigo de 2020, gerando variações absurdas como `+81% em 5 dias`.

## Correção

- A leitura de `asset_price_history` agora é paginada.
- O site busca os registros mais recentes primeiro (`date.desc`).
- Depois reordena em ordem crescente para o gráfico.
- O limite atual é de 2.600 registros por ativo, suficiente para aproximadamente 10 anos de pregões.

## Dividendos

O script `scripts/update_prices_yahoo.py` também passou a tentar gravar proventos retornados pelo yfinance em `asset_dividends`.

Antes de inserir, ele apaga os proventos existentes daquele ticker para evitar duplicidade.

## Teste sugerido

```bash
python scripts/update_prices_yahoo.py PETR4 ITUB4 BBAS3 MXRF11 HGLG11
python scripts/check_supabase_data.py
```

Depois abra:

```text
http://localhost:3000/api/data/asset/petr4
http://localhost:3000/acoes/petr4
http://localhost:3000/acoes/mxrf11
```

Confira se:

- `asset_dividends` tem contagem maior que zero;
- as oscilações de 5 dias, mês e 30 dias ficaram coerentes;
- o gráfico chega até a data mais recente.
