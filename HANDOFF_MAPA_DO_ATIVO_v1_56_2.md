# Handoff — Mapa do Ativo v1.56.2

## Objetivo

Consolidar uma versão limpa para publicação, com a identidade Mapa do Ativo aplicada, menos ruído no repositório e mais transparência para dados em atualização.

## Alterações principais

1. Limpeza do pacote público:
   - Removidos arquivos antigos de correção e handoffs legados do diretório raiz.
   - Mantidos apenas documentos úteis para operação local, GitHub Actions, README e versão atual.

2. Transparência dos dados:
   - Criada `/metodologia/dados-em-atualizacao`.
   - Criada página real `/metodologia/qualidade-dos-dados`.
   - Diretórios e gráficos agora apontam para a explicação de dados em atualização.

3. Segmentos de FIIs:
   - Criado helper `lib/stocks/asset-display.ts` para exibição pública de categoria/segmento.
   - Diretórios e rankings usam segmento inferido quando a fonte retorna apenas “Fundos Imobiliários”.
   - Header e resumo rápido de FIIs usam leitura mais clara.

4. Publicação:
   - Sitemap inclui as novas páginas de metodologia.
   - README e VERSAO alinhados à marca Mapa do Ativo.

## Rotas para validar

```text
/
/acoes
/fiis
/rankings
/rankings/maiores-dividend-yield
/rankings/fiis-maior-dividend-yield
/ferramentas
/comparador
/metodologia
/metodologia/dados-em-atualizacao
/metodologia/qualidade-dos-dados
/sitemap.xml
/robots.txt
/acoes/petr4
/acoes/vale3
/acoes/bbas3
/fiis/xpml11
/fiis/mxrf11
/fiis/kncr11
```

## Comandos

```bash
npm install
npm run build
npm run dev
```

## Variáveis essenciais

```env
NEXT_PUBLIC_SITE_URL=https://www.mapadoativo.com.br
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
BRAPI_API_TOKEN=
MAPA_DO_ATIVO_BUILD_SKIP_EXTERNAL=false
```

## Próximo passo após validar local

Subir esta pasta limpa para o GitHub, configurar a Vercel no repositório `mapa-do-ativo`, adicionar as variáveis de ambiente e gerar o primeiro preview.
