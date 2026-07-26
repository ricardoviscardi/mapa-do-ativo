# Versão atual — v1.56.4

## v1.56.4 — volume recuperado e nomes públicos mais limpos

Ajustes aplicados após teste local das rotas principais do Mapa do Ativo.

### Correções

- Recupera volume negociado a partir do histórico diário quando a cotação principal não retorna volume.
- Mantém o campo Volume como "Não disponível" apenas quando nenhuma fonte confiável retorna volume positivo.
- Inclui volume opcional nos pontos históricos, permitindo reaproveitar volume vindo do Yahoo Finance, brapi ou snapshot.
- Preserva volume vindo do Supabase nos snapshots e no mapeamento interno.
- Simplifica nomes públicos de FIIs quando a fonte retorna razão social longa demais. Exemplos esperados:
  - MXRF11: Maxi Renda FII
  - XPML11: XP Malls FII
- Remove sufixos poluidores de nomes públicos, como ATZ, NM, N1 e N2, quando aparecem no título do ativo.

### Mantido da v1.56.3

- Endpoint /api/data/quality resiliente em modo local sem Supabase.
- Correção da escala de variação diária.
- Auditoria técnica degradada quando o Supabase não está configurado localmente.
- Identidade Mapa do Ativo aplicada.

### Testes recomendados

```txt
http://localhost:3000/api/data/quality
http://localhost:3000/acoes/vale3
http://localhost:3000/fiis/xpml11
http://localhost:3000/fiis/mxrf11
http://localhost:3000/acoes/petr4
http://localhost:3000/acoes/bbas3
```

### Comandos

```bash
npm install
npm run build
npm run dev
```
