# Handoff — Mapa do Ativo v1.56.5

## Objetivo da versão

Entregar uma versão completa para substituição total dos arquivos do projeto, já com os ajustes recentes de identidade, volume, nomes públicos de ativos e preparação para deploy na Vercel com Node 24.

## Alterações aplicadas nesta versão

- `package.json`: atualiza `engines` para Node `24.x` e npm `>=11`.
- `package-lock.json`: sincroniza a versão e os engines do pacote raiz.
- `.npmrc`: define instalação com `legacy-peer-deps`, sem audit/fund e sem bloqueio rígido de engine.
- `vercel.json`: declara projeto Next.js, comando de instalação e comando de build.
- `.env.example`: documenta todas as variáveis necessárias sem expor chaves reais.
- Mantém os ajustes da v1.56.4:
  - recuperação de volume em páginas de ativos;
  - nomes públicos mais limpos para ações e FIIs;
  - Mapa do Ativo aplicado em marca, textos e rodapé;
  - comparador com botão de remover ativo em destaque;
  - `/api/data/quality` resiliente em ambiente local sem Supabase.

## Pontos importantes

- Não inclui `node_modules`, `.next`, `.env.local` nem arquivos de cache.
- O arquivo `.env.example` deve ser copiado para `.env.local` no ambiente local, preenchendo as chaves reais.
- Na Vercel, cadastre as mesmas variáveis em Project Settings → Environment Variables.
- No GitHub Actions, mantenha os secrets:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `BRAPI_API_TOKEN`

## Rotas recomendadas para validação

```txt
http://localhost:3000/api/data/status
http://localhost:3000/api/data/quality
http://localhost:3000/sitemap.xml
http://localhost:3000/robots.txt
http://localhost:3000/
http://localhost:3000/acoes
http://localhost:3000/fiis
http://localhost:3000/rankings
http://localhost:3000/ferramentas
http://localhost:3000/comparador
http://localhost:3000/acoes/petr4
http://localhost:3000/acoes/vale3
http://localhost:3000/acoes/bbas3
http://localhost:3000/fiis/xpml11
http://localhost:3000/fiis/mxrf11
```

## Comandos locais

```bash
npm install
npm run build
npm run dev
```

## Publicação

Após substituir os arquivos:

```bash
git status
git add -A
git commit -m "chore: publica versao final Mapa do Ativo v1.56.5"
git pull --rebase origin main
git push origin main
```

Depois, acione um novo deploy na Vercel.
