# v1.53.9 — Saneamento de demonstrativos e universo B3

Correções principais:

1. Evita que dados complementares com apenas coluna “Atual” empobreçam a Análise Fundamentalista.
2. Mantém tabelas históricas anuais/trimestrais vindas da base consolidada quando disponíveis.
3. Corrige `--all` no importador CVM para processar todos os ativos de ações já cadastrados no Supabase.
4. Adiciona universo amplo/dinâmico de ações B3 na atualização de preços.
5. Adiciona `scripts/check_asset_detail.py` para diagnosticar dados por ticker.

Fluxo recomendado antes de FIIs:

```powershell
python scripts/update_base_inicial.py --b3-stocks --sleep 1
python scripts/update_cvm_companies.py --all --years 2024 2023 2022 2021 --itr-years 2025 2024
python scripts/check_asset_detail.py RENT3
```

No GitHub Actions, use `universo = todas_acoes_b3`.
