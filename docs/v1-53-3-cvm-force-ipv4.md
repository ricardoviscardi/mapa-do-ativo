# v1.53.3 — CVM com IPv4 forçado no GitHub Actions

## Motivo

A rotina `completo_com_itr` concluiu a etapa de preços, mas falhou ao acessar:

```text
https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/cad_cia_aberta.csv
```

Erro observado:

```text
Errno 101: Network is unreachable
```

Mesmo com 8 tentativas, o runner não conseguiu abrir conexão com `dados.cvm.gov.br`.

## Correção

O script `scripts/update_cvm_companies.py` passa a forçar IPv4 por padrão usando:

```text
CVM_FORCE_IPV4=1
```

Também foi adicionado um `User-Agent` específico para os downloads.

## Workflows alterados

```text
.github/workflows/update-acoes.yml
.github/workflows/update-cvm-semanal.yml
```

## Teste recomendado

Rodar:

```text
modo: completo_com_itr
sleep: 1
anos_dfp: 2024 2023 2022 2021
anos_itr: 2025 2024
```

Se ainda houver erro de rede externo da CVM, rodar `precos` e `cvm` em execuções separadas.
