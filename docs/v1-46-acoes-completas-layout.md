# v1.46 — Ações ampliadas + correção de layout

## O que foi corrigido

- Cards e tabelas agora respeitam a largura do container.
- A tabela fundamentalista não força overflow visual fora do layout.
- A base de tickers monitorados foi ampliada, incluindo VIVR3.
- Criada rotina completa de ações:
  - preços e histórico;
  - proventos;
  - cadastro CVM;
  - Balanço Patrimonial;
  - DRE;
  - Fluxo de Caixa;
  - indicadores calculados.

## Nova migração

Execute no Supabase SQL Editor:

```text
supabase/v1-46-demonstrativos-ampliados.sql
```

## Rodar atualização completa de ações

```bash
python scripts/update_all_stocks_full.py
```

Com trimestrais:

```bash
python scripts/update_all_stocks_full.py --with-itr
```

## Testes recomendados

```text
http://localhost:3000/acoes/vivr3
http://localhost:3000/acoes/pomo4
http://localhost:3000/acoes/abev3
http://localhost:3000/acoes/petr4
http://localhost:3000/api/data/quality
```
