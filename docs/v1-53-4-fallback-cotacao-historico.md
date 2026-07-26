# v1.53.4 — Fallback de cotação pelo histórico

Correção aplicada após validação local da página de ação.

## Problema observado

Algumas páginas exibiam gráfico e fundamentos corretamente, mas o cabeçalho mostrava:

- Cotação atual: Não disponível
- Variação não disponível
- Campos de cotação do dia indisponíveis

Isso acontecia quando a tabela `asset_quotes` não retornava a cotação mais recente, apesar de existir histórico em `asset_price_history`.

## Ajuste

A página agora usa o último fechamento histórico como fallback para:

- cotação atual;
- fechamento anterior;
- variação diária;
- volume, quando disponível no histórico;
- cálculo de DY quando necessário.

O gráfico e os fundamentos continuam usando a base consolidada no Supabase.
