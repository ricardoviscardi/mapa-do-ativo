# v1.53.1 — Correção da etapa CVM no GitHub Actions

## Problema

A execução da GitHub Action falhava na etapa de atualização CVM com o erro:

```text
NameError: name 'choose_frame' is not defined
```

A falha acontecia dentro de `scripts/update_cvm_companies.py`, quando `rows_from_zip` tentava localizar quadros como BPA, BPP, DRE e DFC dentro dos ZIPs da CVM.

## Correção aplicada

Foi adicionada a função `choose_frame`, responsável por:

1. Procurar o CSV correto dentro do ZIP da CVM.
2. Preferir arquivos consolidados, como `_con_`.
3. Usar arquivos individuais, como `_ind_`, quando necessário.
4. Retornar `DataFrame` vazio quando um quadro não existir, permitindo fallback seguro.

Também foram adicionadas funções de compatibilidade usadas pela rotina atual:

```text
normalize_cvm_code
references
value_for
quarter_label
```

## Workflow ajustado

O modo `cvm` do workflow `.github/workflows/update-acoes.yml` agora também passa `--itr-years`, usando o campo `anos_itr` informado no GitHub Actions.

## Validação local feita

- `python -m py_compile scripts/*.py`
- Teste local simples da escolha de quadro consolidado em ZIP simulado.

## Próximo passo

Subir esta versão para o GitHub e rodar primeiro:

```text
Actions > Atualizar ações > Run workflow > modo: cvm
```

Depois, se passar, rodar:

```text
modo: completo_com_itr
```
