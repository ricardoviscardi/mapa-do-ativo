# Handoff — Mapa do Ativo v1.56.4

## Objetivo da versão

Corrigir a ausência de volume nas páginas de ativos testadas localmente e melhorar a apresentação pública de nomes de FIIs quando a fonte retorna razão social longa demais.

## Problemas observados nos testes

- `/api/data/quality` retornou em modo degradado, o que está correto no ambiente local sem Supabase.
- Nas páginas de ativos, o campo Volume apareceu como "Não disponível" em todos os ativos testados.
- MXRF11 e XPML11 ficaram com títulos excessivamente longos quando a fonte pública retornou a razão social completa.

## Alterações aplicadas

- `types/stock.ts`: adiciona `volume?: number | null` em `StockHistoryPoint`.
- `lib/stocks/yahoo-client.ts`: passa a carregar volume no histórico diário do Yahoo.
- `lib/stocks/brapi-mapper.ts`: preserva volume dos pontos históricos quando disponível.
- `lib/stocks/supabase-stock-repository.ts`: preserva volume nos pontos históricos vindos do Supabase/snapshot.
- `lib/stocks/stock-service.ts`: usa volume da cotação, depois do histórico e depois das linhas de cotação, nessa ordem.
- `lib/stocks/asset-display.ts`: cria `displayAssetName` para simplificar nomes públicos e remover sufixos poluidores.
- `components/stocks/StockHeader.tsx`: usa `displayAssetName` no título principal.

## Resultado esperado

- VALE3, PETR4, BBAS3, XPML11 e MXRF11 devem continuar com variação diária em escala correta.
- O volume deve aparecer quando o histórico público trouxer volume diário válido.
- Se nenhuma fonte retornar volume, o campo continua "Não disponível", sem inventar dado.
- MXRF11 deve aparecer como `Maxi Renda FII`.
- XPML11 deve aparecer como `XP Malls FII`.

## Próximo passo

Testar localmente, rodar build, commitar e enviar ao GitHub. Depois validar GitHub Actions e configurar o deploy na Vercel.
