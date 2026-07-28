# Versão atual — v1.56.9

## v1.56.9 — favicon e identidade de busca

Versão completa para substituição total dos arquivos do projeto Mapa do Ativo, baseada na v1.56.8 já publicada na Vercel.

### Correções desta versão

- Adiciona favicon oficial em múltiplos formatos para navegador e indexação:
  - `public/favicon.ico`
  - `public/favicon-16x16.png`
  - `public/favicon-32x32.png`
  - `public/apple-touch-icon.png`
  - `public/android-chrome-192x192.png`
  - `public/android-chrome-512x512.png`
- Adiciona `app/icon.png` e `app/apple-icon.png` para integração nativa com Next.js App Router.
- Cria `public/site.webmanifest` para reforçar identidade visual da marca em navegadores e dispositivos.
- Atualiza `app/layout.tsx` com metadados de ícones e manifest.
- Mantém o ícone minimalista “MA” como favicon principal, mais legível em resultados do Google e em abas do navegador.

### Mantido das versões anteriores

- Deploy Vercel com pnpm.
- Build validado por TypeScript.
- Correções de nomes públicos prioritários.
- Diretórios, rankings, comparador e páginas de ativos/FIIs funcionando.
- Sitemap, robots, metodologia, glossário e páginas institucionais.

### Arquivos propositalmente não incluídos

- `node_modules/`
- `.next/`
- `.env.local`
- arquivos de cache TypeScript
- `__pycache__/` e `*.pyc`
