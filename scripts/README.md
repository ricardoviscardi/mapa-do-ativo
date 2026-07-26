# Scripts de atualização do Mapa do Ativo

## Preço, histórico e proventos

```bash
python scripts/update_base_inicial.py --all
```

## Cadastro e fundamentos CVM para ações

Antes de rodar, execute no Supabase:

```text
supabase/v1-44-cvm-cadastro.sql
```

Teste com poucos ativos:

```bash
python scripts/update_cvm_companies.py --tickers ABEV3 PETR4 CMIG4
```

Base ampliada anual:

```bash
python scripts/update_cvm_companies.py --all --years 2025 2024 2023 2022 2021
```

Com trimestrais:

```bash
python scripts/update_cvm_companies.py --all --years 2025 2024 2023 2022 2021 --itr-years 2026 2025
```

## Conferir base

```bash
python scripts/check_supabase_data.py
```

```text
http://localhost:3000/api/data/quality
```

## GitHub Actions

Prefira atualizar a base pelo GitHub Actions:

```text
.github/workflows/update-acoes.yml
.github/workflows/update-cvm-semanal.yml
```
