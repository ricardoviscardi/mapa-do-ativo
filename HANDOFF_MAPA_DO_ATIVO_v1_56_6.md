# Mapa do Ativo v1.56.6 — correção de deploy Vercel com pnpm

## Objetivo

Corrigir falha de deploy na Vercel causada pelo npm durante a instalação de dependências:

`npm error Exit handler never called!`

## Ajustes aplicados

- `package.json` atualizado para versão `1.56.6`.
- `engines.node` definido como `24.x`.
- `packageManager` alterado para `pnpm@10.14.0`.
- `vercel.json` alterado para instalar e buildar com pnpm.
- `package-lock.json` removido do pacote para impedir que a Vercel use `npm ci`.
- Mantidas as correções anteriores de marca, volume, nomes públicos dos ativos, comparador e endpoints.

## Atenção importante

Ao substituir os arquivos no projeto local, apague o `package-lock.json` antigo antes de commitar.
Se ele continuar no repositório, a Vercel pode voltar a tentar usar npm/ci.

## Comandos recomendados no Windows PowerShell

```powershell
Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue
Remove-Item -Recurse node_modules,.next -Force -ErrorAction SilentlyContinue
corepack enable
corepack prepare pnpm@10.14.0 --activate
pnpm install
pnpm run build

git status
git add -A
git commit -m "fix: ajusta deploy Vercel com pnpm"
git pull --rebase origin main
git push origin main
```

## Vercel

Em Project Settings > Build and Deployment, remova qualquer Install Command antigo com `npm ci`.
Use o comando abaixo ou deixe o `vercel.json` controlar:

```bash
corepack enable && corepack prepare pnpm@10.14.0 --activate && pnpm install --no-frozen-lockfile
```

Build Command:

```bash
pnpm run build
```
