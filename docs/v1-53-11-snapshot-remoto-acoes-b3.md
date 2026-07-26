# v1.53.11 — Snapshot remoto para ações da B3

Esta versão corrige o fluxo local quando a rede bloqueia o Supabase via OpenDNS/Cisco Umbrella.

## Problema corrigido

Quando `localhost` não consegue acessar o Supabase, a página caía em dados complementares públicos e ficava pobre:

- análise fundamentalista apenas com coluna Atual;
- Balanço, DRE e Fluxo de Caixa sem 5 anos;
- dividendos e proventos sem histórico consolidado;
- `/api/data/asset/[ticker]` retornando `found: false`.

## Solução

A ordem de leitura passa a ser:

1. Supabase, quando acessível;
2. snapshot local em `public/data/snapshots/stocks`;
3. snapshot remoto publicado no próprio repositório;
4. complemento público parcial somente como último recurso.

O workflow `Atualizar ações` agora tem o campo `publicar_snapshot` e pode commitar os snapshots em `public/data/snapshots` para o teste local funcionar mesmo em rede bloqueada.

## Como rodar

No GitHub Actions:

- modo: `completo_com_itr`
- universo: `todas_acoes_b3`
- publicar_snapshot: `sim`
- anos_dfp: `2024 2023 2022 2021`
- anos_itr: `2025 2024`

Depois que a Action terminar, rodar localmente:

```powershell
git pull
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
npm run dev
```

Teste:

```text
/api/data/status
/api/data/asset/lren3
/acoes/lren3
/acoes/abev3
/acoes/suzb3
```
