# v1.53.12 — Snapshot obrigatório para dados históricos locais

Esta versão corrige o fluxo de teste local em redes que bloqueiam o Supabase.

Quando `/api/data/status` mostrar bloqueio por OpenDNS/Cisco Umbrella, as páginas só conseguirão exibir Indicadores, Balanço, DRE, Fluxo de Caixa e Proventos com 5 anos se existir snapshot em `public/data/snapshots`.

## Workflow recomendado

1. Faça commit/push da versão.
2. Rode o workflow **Recriar snapshot de ações**.
3. Marque `publicar_snapshot: sim`.
4. Aguarde ficar verde.
5. Rode `git pull` localmente.
6. Reinicie o Next limpando `.next`.

## Validação

Abra:

```text
/api/data/asset/lren3
```

O retorno precisa ter:

```json
{ "found": true, "historicalBaseLoaded": true }
```

Se aparecer `historicalBaseLoaded: false`, a página está em modo parcial e não deve ser usada para validar os demonstrativos históricos.
