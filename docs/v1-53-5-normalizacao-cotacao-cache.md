# v1.53.5 — Normalização de cotação e limpeza de cache

Correção criada após a página de ações continuar exibindo “Não disponível” na cotação atual mesmo com gráfico histórico carregado.

## Ajustes

- Normalização mais rígida de números vindos do Supabase.
- Fallback adicional no cabeçalho da ação usando o último ponto do histórico.
- Atualização da versão do cache interno para evitar dados antigos em desenvolvimento.
- Tratamento mais seguro para percentuais de dividend yield fora de faixa.
- Uso mais consistente do histórico para fechamento anterior, volume e oscilações.

## Como testar

1. Substituir os arquivos pelo ZIP completo.
2. Parar o servidor local.
3. Rodar novamente:

```powershell
npm run dev
```

4. Abrir:

```text
http://localhost:3000/acoes/rail3
http://localhost:3000/acoes/petr3
http://localhost:3000/acoes/petr4
http://localhost:3000/acoes/pomo4
```

A cotação atual deve aparecer usando a cotação direta quando existir ou o último fechamento histórico como fallback.
