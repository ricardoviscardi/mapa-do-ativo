# v1.44 — CVM cadastro + fundamentos oficiais

## Objetivo

Complementar a base própria com dados oficiais de companhias abertas.

## Novidades

- Cadastro CVM para ações;
- CNPJ quando a associação entre ticker e companhia for segura;
- Código CVM;
- Balanço Patrimonial anual;
- DRE anual;
- Fluxo de Caixa anual;
- ITR trimestral opcional;
- indicadores calculados a partir dos demonstrativos.

## Como rodar

1. Execute no SQL Editor do Supabase:

```text
supabase/v1-44-cvm-cadastro.sql
```

2. Teste uma amostra:

```bash
python scripts/update_cvm_companies.py --tickers ABEV3 PETR4 CMIG4
```

3. Rode a base ampliada:

```bash
python scripts/update_cvm_companies.py --all --years 2025 2024 2023 2022 2021
```

4. Trimestrais, quando quiser:

```bash
python scripts/update_cvm_companies.py --all --years 2025 2024 2023 2022 2021 --itr-years 2026 2025
```

## Observações

A correspondência ticker/companhia é conservadora. Quando a associação não é segura, o script não grava CNPJ para evitar erro.

FIIs entram em etapa própria.
