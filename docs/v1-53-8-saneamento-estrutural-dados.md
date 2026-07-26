# v1.53.8 — saneamento estrutural dos dados de ações

Esta versão corrige a ligação das páginas de ações com a base consolidada e reduz falhas causadas por bloqueio local de rede/VPN.

## Problema observado

As páginas exibiam cotação no cabeçalho, mas deixavam campos básicos vazios em:

- Cotação do dia
- Análise fundamentalista
- Indicadores anuais
- Dividendos 12m

Além disso, em alguns ativos o complemento em tempo de execução substituía uma tabela rica da base por uma tabela de apenas uma coluna “Atual”.

## Correções

- `lib/supabase/server.ts` passou a usar `node:https` com IPv4 forçado por padrão.
- `asset_financials`, `asset_indicators` e `asset_dividends` agora são consultados com limites maiores.
- Indicadores anuais podem ser reconstruídos a partir dos demonstrativos CVM quando necessário.
- A análise fundamentalista passa a mesclar tabelas célula a célula.
- A cotação do dia é normalizada no final do fluxo, sempre coerente com a cotação exibida no cabeçalho.
- Dividend Yield continua com saneamento de plausibilidade.

## Observação

Se `/api/data/status` não conectar ao Supabase no ambiente local, a página ainda funcionará com complemento público, mas a análise CVM anual/trimestral ficará limitada. Para validar completamente, a conexão local com Supabase precisa estar funcionando ou o teste deve ser feito em ambiente sem bloqueio de rede.
