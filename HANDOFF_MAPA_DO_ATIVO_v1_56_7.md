# Mapa do Ativo v1.56.7 — correção TypeScript do histórico e build pnpm

## Objetivo

Corrigir o erro de typecheck em `lib/stocks/brapi-mapper.ts` identificado ao rodar `pnpm run build` localmente.

## Ajustes

- Corrigido o tipo do mapeamento de histórico em `mapHistory`/rotina equivalente do BRAPI mapper.
- O array `mapped` agora é explicitamente tipado como `StockHistoryPoint[]`.
- O callback `.map` retorna `StockHistoryPoint | null`.
- O filtro remove `null` com type predicate compatível.
- O campo `volume` passa a ser normalizado como `volume: volume ?? null`, evitando `undefined` em um ponto saneado.
- `package.json` atualizado para `1.56.7`.
- Script de build alterado para `tsc --noEmit && next build`, evitando chamar `npm run typecheck` dentro do fluxo pnpm.

## Comandos locais recomendados

```powershell
npm exec --yes --package=pnpm@10.14.0 -- pnpm install --no-frozen-lockfile
npm exec --yes --package=pnpm@10.14.0 -- pnpm run build
```

## Vercel

Manter:

- Install Command: `corepack enable && corepack prepare pnpm@10.14.0 --activate && pnpm install --no-frozen-lockfile`
- Build Command: `pnpm run build`
- Node.js: `24.x`
