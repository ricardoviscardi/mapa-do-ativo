# Versão atual — v1.56.5

## v1.56.5 — pacote final para GitHub e Vercel

Versão completa para substituição total dos arquivos do projeto Mapa do Ativo.

### Correções desta versão

- Ajusta `package.json` para Node `24.x`, evitando o bloqueio de deploy da Vercel por Node 20.
- Sincroniza `package-lock.json` com os engines do pacote.
- Adiciona `.npmrc` com instalação mais tolerante a dependências peer.
- Adiciona `vercel.json` para declarar Next.js, comando de instalação e comando de build.
- Adiciona `.env.example` com as variáveis necessárias para local, GitHub Actions e Vercel.

### Mantido da v1.56.4

- Volume restaurado quando a fonte pública ou snapshot traz volume válido.
- Nomes públicos mais limpos para ações e FIIs.
- Identidade Mapa do Ativo aplicada.
- Comparador com botão de remoção mais visível.
- Endpoint `/api/data/quality` resiliente em ambiente local.

### Arquivos propositalmente não incluídos

- `node_modules/`
- `.next/`
- `.env.local`
- arquivos de cache TypeScript
- `__pycache__/` e `*.pyc`
