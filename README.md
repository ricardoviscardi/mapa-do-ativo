# Mapa do Ativo

**Do ativo ao patrimônio.**

Projeto Next.js + React + TypeScript para consulta pública de ações brasileiras e FIIs, com páginas de ativos, rankings, glossário, metodologia e ferramentas interativas.

## Objetivo

Entregar uma experiência clara para quem quer analisar ativos, comparar alternativas e organizar premissas de carteira em um só ambiente.

## Principais recursos

- Consulta de ações brasileiras e FIIs por ticker.
- Páginas individuais com cotação, gráfico, oscilações, dividendos, indicadores e fundamentos.
- Diretórios filtráveis de ações e FIIs.
- Rankings por Dividend Yield, P/L, P/VP, ROE, ROIC, valor de mercado, volume e métricas de FIIs.
- Comparador lado a lado.
- Calculadora de preço-teto.
- Simulador de proventos.
- Raio-X de carteira.
- Glossário, metodologia e páginas de transparência para dados em atualização.
- Sitemap, robots e endpoints de diagnóstico preparados para deploy na Vercel.
- Google Analytics 4 com consentimento prévio, opção de recusa e gestão posterior da preferência.
- GitHub Actions para atualização de ações, FIIs e fundamentos CVM.

## Páginas principais

```text
/
/acoes
/fiis
/rankings
/ferramentas
/comparador
/glossario
/metodologia
/metodologia/dados-em-atualizacao
/metodologia/qualidade-dos-dados
/sobre
/contato
```

## Comandos locais

```bash
npm exec --yes --package=pnpm@10.14.0 -- pnpm install --no-frozen-lockfile
npm exec --yes --package=pnpm@10.14.0 -- pnpm run build
npm exec --yes --package=pnpm@10.14.0 -- pnpm run dev
```

## Rotas de validação

```text
http://localhost:3000/
http://localhost:3000/acoes
http://localhost:3000/fiis
http://localhost:3000/rankings
http://localhost:3000/ferramentas
http://localhost:3000/comparador
http://localhost:3000/metodologia/dados-em-atualizacao
http://localhost:3000/metodologia/qualidade-dos-dados
http://localhost:3000/acoes/petr4
http://localhost:3000/fiis/xpml11
http://localhost:3000/api/data/status
http://localhost:3000/api/data/quality
http://localhost:3000/sitemap.xml
http://localhost:3000/robots.txt
```

## Variáveis recomendadas na Vercel

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
BRAPI_API_TOKEN=
NEXT_PUBLIC_SITE_URL=https://mapa-do-ativo.vercel.app
NEXT_PUBLIC_SHOW_DATA_WARNINGS=false
MAPA_DO_ATIVO_BUILD_SKIP_EXTERNAL=false
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

## Workflows principais

```text
Atualizar ações
Atualizar FIIs
Atualizar fundamentos CVM semanal
```

## Marca

Nome público: **Mapa do Ativo**

Slogan: **Do ativo ao patrimônio.**

Contato padrão: `contato@mapadoativo.com.br`
