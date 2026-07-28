# Como testar localmente quando a rede bloqueia o Supabase

Se `/api/data/status` mostrar `blockedByNetwork: true` ou mensagens com `malware.opendns.com`, sua rede está bloqueando o Supabase.

Nessa condição, a página local não consegue puxar dados completos de Balanço, DRE, Fluxo de Caixa e indicadores históricos diretamente do banco.

## Caminho recomendado

1. Faça commit e push desta versão.
2. No GitHub Actions, rode `Atualizar ações` com:
   - modo: `completo_com_itr`
   - universo: `todas_acoes_b3`
   - sleep: `1`
   - anos_dfp: `2024 2023 2022 2021`
   - anos_itr: `2025 2024`
3. Ao finalizar, abra a execução da Action e baixe o artifact `snapshot-local-acoes`.
4. Extraia o conteúdo dentro da pasta `public/` do projeto local.
5. Confirme que existe:
   - `public/data/snapshots/index.json`
   - `public/data/snapshots/stocks/LREN3.json`
6. Pare e reinicie o servidor local:

```powershell
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
npm run dev
```

7. Teste:

```text
http://localhost:3000/api/data/status
http://localhost:3000/api/data/asset/lren3
http://localhost:3000/acoes/lren3
```

