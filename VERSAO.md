# Versão atual — v1.56.10

## v1.56.10 — header alinhado ao favicon + handoff de recuperação

Versão completa para substituição total dos arquivos do projeto **Mapa do Ativo**, baseada na v1.56.9.

### Correções desta versão

- Ajusta o ícone do header para usar o mesmo estilo visual do favicon oficial.
- O header deixa de usar o monograma textual simples `MA` renderizado por CSS e passa a usar o arquivo visual da marca:
  - `public/android-chrome-192x192.png`
- Mantém a identidade visual do favicon em navegador, Google, mobile e cabeçalho do site.
- Inclui handoff completo e autoexplicativo do projeto para continuidade ou reconstrução em outra conversa.

### Mantido das versões anteriores

- Favicon oficial completo:
  - `public/favicon.ico`
  - `public/favicon-16x16.png`
  - `public/favicon-32x32.png`
  - `public/apple-touch-icon.png`
  - `public/android-chrome-192x192.png`
  - `public/android-chrome-512x512.png`
  - `app/icon.png`
  - `app/apple-icon.png`
  - `public/site.webmanifest`
- Deploy Vercel com pnpm.
- Node.js `24.x`.
- Build validado por TypeScript nas versões anteriores.
- Correções de nomes públicos prioritários:
  - `BBAS3` → `Banco do Brasil ON`
  - `XPML11` → `XP Malls FII`
  - `MXRF11` → `Maxi Renda FII`
- Diretórios, rankings, comparador e páginas de ativos/FIIs funcionando.
- Sitemap, robots, metodologia, glossário e páginas institucionais.

### Arquivos alterados nesta versão

- `components/layout/Header.tsx`
- `package.json`
- `VERSAO.md`
- `HANDOFF_MAPA_DO_ATIVO_v1_56_10_COMPLETO.md`

### Arquivos propositalmente não incluídos

- `node_modules/`
- `.next/`
- `.env.local`
- `package-lock.json`
- arquivos de cache TypeScript
- `__pycache__/` e `*.pyc`
