# v1.35 — Polimento de produção

Correções aplicadas:

- A aba **Trimestral** deixa de aparecer quando não há dados trimestrais úteis para o ativo.
- Abas vazias de **Balanço Patrimonial**, **DRE** e **Fluxo de Caixa** ficam ocultas até existirem dados reais.
- Mensagens técnicas com referência a Supabase/debug deixam de aparecer na interface pública.
- O aviso de disponibilidade de dados fica oculto por padrão e só aparece se `NEXT_PUBLIC_SHOW_DATA_WARNINGS=true`.
- Cabeçalho não exibe mais `Não disponível (Não disponível)` quando não há variação da cotação.

Objetivo: deixar o site com aparência mais profissional antes do deploy, sem expor diagnósticos técnicos ao visitante.
