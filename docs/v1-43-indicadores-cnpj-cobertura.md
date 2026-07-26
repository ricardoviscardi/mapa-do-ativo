# v1.43 — Indicadores calculados, CNPJ oculto e cobertura da base

## Ajustes

- Reforço no cálculo de ROIC quando houver EBIT, patrimônio líquido, dívida e caixa retornados pelas fontes de dados.
- Reforço no cálculo de Dív.Líq/EBITDA quando houver dívida total, caixa e EBITDA.
- Inclusão de mais linhas na tabela anual de indicadores para ações:
  - VPA;
  - Valor de mercado;
  - Dividendo/ação.
- CNPJ e site deixam de aparecer quando não estiverem disponíveis, evitando a percepção de erro na interface.
- Documentação deixa claro que a base ampliada reduz páginas vazias, mas ainda não representa cobertura integral de todos os ativos listados na B3.

## Observação

Os dados de CNPJ e uma cobertura mais oficial dos demonstrativos devem ser tratados na etapa CVM, porque o Yahoo/yfinance geralmente não retorna CNPJ.
