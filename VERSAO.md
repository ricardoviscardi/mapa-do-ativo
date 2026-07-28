# Versão atual — v1.56.8

## v1.56.8 — polimento final de publicação

Versão completa para substituição total dos arquivos do projeto Mapa do Ativo, baseada na v1.56.7 já publicada com sucesso na Vercel.

### Correções desta versão

- Corrige nomes públicos prioritários:
  - `BBAS3` → `Banco do Brasil ON`
  - `XPML11` → `XP Malls FII`
  - `MXRF11` → `Maxi Renda FII`
- Remove imagem externa quebrada no topo das páginas de FIIs, usando fallback textual do ticker.
- Centraliza a identificação de tipo de ativo para evitar classificar units de ações como FIIs.
- Corrige diretórios e rankings para respeitarem a classificação real de ações e FIIs.
- Ajusta o texto do diretório para “ativos monitorados”, deixando claro que a base inicial é uma seleção curada.
- Remove do sitemap os tickers em observação até a qualidade ficar consistente: `AZUL4`, `CPLE6`, `BCFF11`, `IRDM11` e `PMLL11`.
- Mantém Node `24.x`, `pnpm` e build validado por TypeScript.

### Mantido das versões anteriores

- Deploy Vercel com pnpm.
- Correção de TypeScript no histórico com volume.
- Volume restaurado quando a fonte pública ou snapshot traz volume válido.
- Identidade Mapa do Ativo aplicada.
- Comparador com botão de remoção destacado.
- Endpoint `/api/data/quality` resiliente.
- Sitemap, robots e páginas de metodologia/glossário.

### Arquivos propositalmente não incluídos

- `node_modules/`
- `.next/`
- `.env.local`
- arquivos de cache TypeScript
- `__pycache__/` e `*.pyc`
