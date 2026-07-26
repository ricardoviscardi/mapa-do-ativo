# v1.38 — ações com fundamentos Yahoo/yfinance + proventos 5 anos

## Objetivo

Melhorar a cobertura de ações enquanto a integração oficial com CVM DFP/ITR ainda não está completa.

## O que foi adicionado

- Coleta de demonstrativos básicos via Yahoo/yfinance para ações.
- Gravação em `asset_financials`.
- Cálculo de indicadores anuais quando houver dados suficientes:
  - P/L;
  - P/VP;
  - ROE;
  - ROA;
  - Margem líquida;
  - VPA;
  - Dividend Yield anual.
- Exibição de proventos por até 5 anos.

## Como testar CMIG4

```bash
python scripts/update_prices_yahoo.py CMIG4
python scripts/check_supabase_data.py
```

Depois abrir:

```text
http://localhost:3000/acoes/cmig4
http://localhost:3000/api/data/asset/cmig4
```

## Observação

Essa etapa ainda usa Yahoo/yfinance como ponte de custo mínimo. A base definitiva de fundamentos deve vir da CVM DFP/ITR na próxima etapa.
