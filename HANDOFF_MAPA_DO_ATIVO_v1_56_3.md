# Handoff — Mapa do Ativo v1.56.3

## Objetivo

Corrigir os pontos encontrados na validação local após execução dos workflows: endpoint de qualidade sem retorno quando o Supabase local não está configurado e percentuais de variação diária exibidos fora de escala em alguns ativos.

## Alterações principais

1. `/api/data/quality` mais robusto:
   - Quando `SUPABASE_URL` ou chave local não estão configurados, o endpoint deixa de quebrar.
   - Retorna JSON em modo degradado, informando `degraded: true`, status da conexão, snapshot local/remoto e auditoria dos ativos críticos pelo fallback disponível.
   - Mantém a auditoria completa quando o Supabase está configurado corretamente.

2. Correção de variação percentual:
   - `change_percent` vindo do Supabase passa a ser tratado como percentual já normalizado.
   - A camada de exibição recalcula a variação com base em `changeValue / previousClose` quando detecta valor claramente escalado, como `+46,06%` no lugar de `+0,46%`.
   - O cartão de oscilação “Dia” também recebe o valor saneado.

3. Limpeza de texto exibido:
   - Removido sufixo solto `ATZ` de nomes públicos de ativos quando aparecer isolado no cadastro da fonte.

4. Cache:
   - Cache interno de ativos atualizado para `v1563`, evitando reaproveitar dados formatados pela versão anterior.

## Rotas para validar

```text
/api/data/status
/api/data/quality
/sitemap.xml
/robots.txt
/
/acoes
/fiis
/rankings
/ferramentas
/comparador
/acoes/petr4
/acoes/vale3
/acoes/bbas3
/fiis/xpml11
/fiis/mxrf11
```

## Atenção

Se `/api/data/status` mostrar `connected: false` com mensagem de Supabase não configurado, isso é esperado quando não existe `.env.local` no computador. O site ainda pode funcionar com snapshot local/remoto, mas a auditoria completa e a Vercel precisam das variáveis configuradas.

## Próximo passo

Aplicar a versão, rodar `npm run build`, testar `/api/data/quality` e conferir se as variações de VALE3, XPML11 e MXRF11 aparecem em escala normal.
