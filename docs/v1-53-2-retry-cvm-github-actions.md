# v1.53.2 — Retry para CVM no GitHub Actions

Esta versão melhora a estabilidade da importação da CVM.

## Erro tratado

No modo `completo_com_itr`, a etapa de preços terminou, mas a etapa CVM falhou ao acessar:

```text
dados.cvm.gov.br
```

Erro observado:

```text
Network is unreachable
Max retries exceeded
```

## Ajuste aplicado

O arquivo `scripts/update_cvm_companies.py` agora usa uma função de download com novas tentativas automáticas antes de falhar definitivamente.

Variáveis opcionais:

```text
CVM_RETRY_ATTEMPTS=6
CVM_RETRY_BASE_SLEEP=10
```

## Validação recomendada

Rodar no GitHub Actions:

```text
modo: completo_com_itr
sleep: 1
anos_dfp: 2024 2023 2022 2021
anos_itr: 2025 2024
```

Depois conferir a base com:

```powershell
python scripts/check_supabase_data.py
```
