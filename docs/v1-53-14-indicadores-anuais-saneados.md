# v1.53.14 — Indicadores anuais saneados

Correção focada na tabela de Análise Fundamentalista.

- Indicadores anuais agora priorizam cálculos derivados dos demonstrativos anuais da CVM.
- Corrige P/L, P/VP, ROE, ROA, ROIC, margem líquida, VPA e valor de mercado quando a base de indicadores vinha com escala inconsistente.
- Normaliza quantidade de ações quando vem 10x maior/menor que a base atual.
- Mantém Balanço, DRE, Fluxo de Caixa e Dividendos conectados ao snapshot local.
- Bump de cache para v15314.
