# v1.34 — Indicadores anuais de FIIs com custo mínimo

## O que mudou

A etapa anterior já populava cotação, histórico, alguns indicadores e dividendos.
Nesta versão, o script `scripts/update_prices_yahoo.py` passa a calcular linhas anuais em `asset_indicators`.

Para FIIs, isso permite preencher a aba **Análise fundamentalista > Indicadores** com dados por ano, quando houver dados no Yahoo/yfinance.

## Campos calculados por ano

- Dividendo/Cota: soma dos rendimentos pagos no ano;
- Dividend Yield anual: soma dos rendimentos do ano dividida pela cotação de fechamento do fim do ano;
- Valor de mercado estimado: fechamento do fim do ano x número atual de cotas, quando o Yahoo retornar número de cotas;
- Nº de cotas: número atual retornado pelo Yahoo, quando disponível.

## Campos que continuam sem histórico até a CVM

- P/VP histórico;
- VP/Cota histórico;
- patrimônio líquido histórico;
- nº histórico real de cotas;
- FFO, FFO Yield e FFO/Cota.

Esses campos dependem de integração com os informes de FIIs da CVM ou API paga mais robusta.

## Como atualizar

```bash
python scripts/update_prices_yahoo.py MXRF11 HGLG11
python scripts/check_supabase_data.py
```
