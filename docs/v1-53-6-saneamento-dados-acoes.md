# v1.53.6 — Saneamento de dados das páginas de ações

Esta versão corrige inconsistências vistas na página de ações após a atualização completa com ITR.

## Problemas tratados

1. Dividend Yield exibindo percentual distorcido em alguns ativos.
2. Cabeçalho já corrigido por histórico, mas cards laterais ainda mostrando muitas linhas indisponíveis.
3. Análise fundamentalista vazia mesmo quando existiam indicadores-chave disponíveis.
4. Possibilidade de uma falha isolada em tabela do Supabase fazer a página cair para fallback externo.
5. Texto público expondo detalhes técnicos de fornecedores de dados.

## Soluções aplicadas

- Normalização separada para percentuais que já estão em formato percentual e valores que vêm como razão decimal.
- Limite de plausibilidade para DY: até 25% para ações e até 35% para FIIs nesta camada de exibição.
- Filtro de eventos de proventos incompatíveis com a cotação atual.
- Fallback de análise fundamentalista usando indicadores atuais quando demonstrativos completos ainda não estiverem prontos.
- Leitura tolerante de tabelas auxiliares do Supabase.
- Mensagens públicas mais profissionais e sem nomes de fornecedores técnicos.

## Testes sugeridos

```text
http://localhost:3000/acoes/rail3
http://localhost:3000/acoes/petr3
http://localhost:3000/acoes/petr4
http://localhost:3000/acoes/pomo4
http://localhost:3000/acoes/abev3
http://localhost:3000/rankings
http://localhost:3000/api/acoes/rail3
http://localhost:3000/api/data/asset/rail3
http://localhost:3000/api/data/quality
```

## Observação

Nem todos os ativos terão balanço, DRE e fluxo de caixa completos. Quando isso ocorrer, a página deve mostrar indicadores disponíveis e mensagens de consolidação, sem exibir percentuais claramente errados.
