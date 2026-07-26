# v1.40 — Padronização em português do Brasil

## Objetivo

Manter a interface pública do Mapa do Ativo em português, mesmo quando algum campo bruto venha em inglês de fontes de mercado.

## Ajustes

- Setores e segmentos são traduzidos na camada de exibição.
- O script Python também passa a gravar setores e segmentos já padronizados em português quando possível.
- Exemplos tratados:
  - Energy → Energia;
  - Oil & Gas Integrated → Petróleo e gás integrado;
  - REIT - Diversified → FII - Diversificado.

## Observação

Para os dados já gravados no Supabase, a correção aparece pela interface sem precisar rodar Python novamente. Se o script for executado outra vez, os novos registros também serão salvos em português.
