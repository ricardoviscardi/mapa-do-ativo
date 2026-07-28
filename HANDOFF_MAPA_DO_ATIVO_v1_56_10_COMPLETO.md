# HANDOFF COMPLETO — MAPA DO ATIVO v1.56.10

> Documento de continuidade e recuperação do projeto.  
> Objetivo: permitir retomar o desenvolvimento em outra conversa, ou reconstruir a mesma versão do projeto a partir do backup, mesmo em caso de perda da pasta local.

---

## 1. Identificação do projeto

**Nome atual:** Mapa do Ativo  
**Nome anterior:** Foco Invest  
**Slogan:** Do ativo ao patrimônio.  
**Contato institucional:** contato@mapadoativo.com.br  
**Tipo do projeto:** plataforma educacional/financeira para consulta pública de ações brasileiras e FIIs.

**Repositório GitHub:**

```txt
https://github.com/ricardoviscardi/mapa-do-ativo
```

**Projeto Vercel:**

```txt
mapa-do-ativo
```

**Versão mais recente deste handoff:**

```txt
v1.56.10 — header alinhado ao favicon + handoff de recuperação
```

**Backup correspondente:**

```txt
mapa-do-ativo-v1-56-10-header-favicon-handoff.zip
```

---

## 2. Resumo executivo do estado atual

O projeto já passou pela fase crítica de deploy e está funcionando na Vercel. A versão v1.56.7 foi publicada com sucesso em produção. Depois disso foram geradas versões de polimento:

- **v1.56.8:** polimento de nomes públicos, FIIs, classificação, rankings e sitemap.
- **v1.56.9:** inclusão de favicon completo para navegador, Google e mobile.
- **v1.56.10:** ajuste do ícone do header para corresponder ao mesmo estilo visual do favicon, além deste handoff completo.

A versão atual contém a base completa do site, favicon oficial, metadados de ícones no Next.js, páginas públicas, diretórios, rankings, comparador, endpoints técnicos e workflows de atualização de dados.

---

## 3. Stack técnica

```txt
Next.js App Router
TypeScript
React
Tailwind CSS
Supabase/Postgres
GitHub Actions
Vercel
pnpm
Node.js 24.x
Python scripts para carga/auditoria de dados
```

**Gerenciador de pacotes recomendado:**

```txt
pnpm 10.14.0
```

**Node recomendado:**

```txt
24.x
```

---

## 4. Estrutura principal do projeto

```txt
mapa-do-ativo/
├─ app/
│  ├─ page.tsx
│  ├─ layout.tsx
│  ├─ globals.css
│  ├─ icon.png
│  ├─ apple-icon.png
│  ├─ robots.ts
│  ├─ sitemap.ts
│  ├─ acoes/
│  ├─ fiis/
│  ├─ rankings/
│  ├─ ferramentas/
│  ├─ comparador/
│  ├─ glossario/
│  ├─ metodologia/
│  ├─ sobre/
│  ├─ contato/
│  ├─ privacidade/
│  └─ termos/
├─ components/
│  ├─ layout/
│  │  ├─ Header.tsx
│  │  └─ Footer.tsx
│  ├─ search/
│  ├─ stocks/
│  └─ ui/
├─ lib/
│  ├─ stocks/
│  ├─ rankings/
│  ├─ directories/
│  ├─ content/
│  ├─ supabase/
│  ├─ utils/
│  └─ seo.ts
├─ public/
│  ├─ favicon.ico
│  ├─ favicon-16x16.png
│  ├─ favicon-32x32.png
│  ├─ apple-touch-icon.png
│  ├─ android-chrome-192x192.png
│  ├─ android-chrome-512x512.png
│  ├─ favicon-source-ma.png
│  ├─ site.webmanifest
│  └─ logo.svg
├─ scripts/
├─ supabase/
├─ types/
├─ .github/workflows/
├─ package.json
├─ pnpm-lock.yaml
├─ vercel.json
├─ README.md
├─ VERSAO.md
└─ HANDOFF_MAPA_DO_ATIVO_v1_56_10_COMPLETO.md
```

Arquivos que **não** devem ser versionados nem copiados como parte do backup:

```txt
node_modules/
.next/
.env.local
package-lock.json
__pycache__/
*.pyc
arquivos de cache TypeScript
```

---

## 5. Identidade visual e marca

### Marca

```txt
Mapa do Ativo
```

### Slogan

```txt
Do ativo ao patrimônio.
```

### Favicon oficial

A versão v1.56.9 criou o favicon oficial em estilo monograma **MA** branco sobre fundo azul, com linguagem visual mais forte, premium e compatível com navegador/Google/mobile.

Arquivos do favicon:

```txt
app/icon.png
app/apple-icon.png
public/favicon.ico
public/favicon-16x16.png
public/favicon-32x32.png
public/apple-touch-icon.png
public/android-chrome-192x192.png
public/android-chrome-512x512.png
public/site.webmanifest
public/favicon-source-ma.png
```

### Ajuste da v1.56.10 — Header

O header antes usava um ícone gerado por texto simples:

```tsx
<span>MA</span>
```

Na v1.56.10, o header foi ajustado para usar o mesmo estilo visual do favicon:

```tsx
<img
  src="/android-chrome-192x192.png"
  alt="Mapa do Ativo"
  width={36}
  height={36}
  className="h-9 w-9 rounded-xl object-contain"
  draggable={false}
/>
```

Arquivo alterado:

```txt
components/layout/Header.tsx
```

Objetivo: manter coerência visual entre favicon, Google, navegador e cabeçalho do site.

---

## 6. Funcionalidades do produto

### 6.1 Home

Rota:

```txt
/
```

Função:

- Apresentar a marca Mapa do Ativo.
- Comunicar o slogan “Do ativo ao patrimônio”.
- Destacar busca por ticker.
- Exibir ações e FIIs em destaque.
- Apontar ferramentas, rankings e conteúdo educativo.

### 6.2 Diretório de ações

Rota:

```txt
/acoes
```

Função:

- Listar ações brasileiras monitoradas.
- Permitir busca por ticker/nome.
- Exibir indicadores resumidos.
- Agrupar por setores.
- Dar acesso às páginas individuais de ativos.

Último teste visual indicou:

```txt
Ações exibidas no diretório: 90
Comparação por setor: 15
Rankings atualizados: 82
```

### 6.3 Diretório de FIIs

Rota:

```txt
/fiis
```

Função:

- Listar FIIs monitorados.
- Permitir busca por ticker/nome.
- Exibir dividend yield, P/VP, patrimônio e liquidez.
- Agrupar por segmentos.
- Dar acesso às páginas individuais de FIIs.

Último teste visual indicou:

```txt
FIIs exibidos no diretório: 52
Comparação por segmento: 12
Rankings de FIIs: 48
```

### 6.4 Páginas individuais de ações

Exemplos testados:

```txt
/acoes/petr4
/acoes/vale3
/acoes/bbas3
```

Funcionalidades:

- Cotação atual.
- Variação do dia.
- Volume.
- Valor de mercado.
- Gráfico por períodos.
- Dividendos 12M.
- Indicadores e fundamentos.
- Resumo rápido.
- Metodologia de dados saneados.

### 6.5 Páginas individuais de FIIs

Exemplos testados:

```txt
/fiis/xpml11
/fiis/mxrf11
```

Funcionalidades:

- Cotação atual.
- Abertura, máxima, mínima, fechamento anterior.
- Volume.
- Valor de mercado.
- Dividendos 12M.
- Segmento.
- Gráfico histórico.
- Fallback textual/visual quando não há imagem externa confiável.

### 6.6 Rankings

Rota principal:

```txt
/rankings
```

Rotas relevantes no sitemap:

```txt
/rankings/maiores-dividend-yield
/rankings/menores-pl
/rankings/menores-pvp
/rankings/maiores-roe
/rankings/maiores-roic
/rankings/maiores-valor-de-mercado
/rankings/acoes-mais-negociadas
/rankings/fiis-maior-dividend-yield
/rankings/fiis-menor-pvp
/rankings/fiis-maior-patrimonio
/rankings/fiis-mais-negociados
```

A lógica dos rankings evita casos muito distorcidos e separa dados atípicos quando aplicável.

### 6.7 Ferramentas

Rota:

```txt
/ferramentas
```

Cards atuais:

```txt
Calculadora de preço-teto
Simulador de proventos
Raio-X de carteira
Comparador
Premissas ajustáveis
Ativos lado a lado
Raio-X visual
```

Texto da página:

```txt
Ferramentas para ir do ativo à carteira
```

### 6.8 Comparador

Rota:

```txt
/comparador
```

Funcionalidades:

- Buscar ativos para comparação.
- Selecionar vários tickers.
- Remover ticker com botão “x”.
- Botão de remoção já está destacado em vermelho/rosa.
- Comparações populares configuradas.
- Exibição lado a lado de indicadores.

### 6.9 Glossário

Rota principal:

```txt
/glossario
```

Termos relevantes no sitemap:

```txt
/glossario/pl
/glossario/pvp
/glossario/dividend-yield
/glossario/roe
/glossario/roa
/glossario/roic
/glossario/margem-liquida
/glossario/ev-ebitda
/glossario/divida-liquida-ebitda
/glossario/vpa
/glossario/valor-de-mercado
/glossario/lpa
/glossario/payout
/glossario/divida-liquida
/glossario/valor-patrimonial-por-cota
/glossario/patrimonio-liquido
/glossario/liquidez-diaria
/glossario/volume-negociado
/glossario/vacancia
/glossario/segmento-de-fii
/glossario/ifix
/glossario/ibovespa
/glossario/cagr
/glossario/provento-extraordinario
/glossario/amortizacao
```

### 6.10 Metodologia

Rotas principais:

```txt
/metodologia
/metodologia/como-ler-os-rankings
/metodologia/criterios-dos-rankings
/metodologia/qualidade-dos-dados
/metodologia/dados-em-atualizacao
```

Função:

- Explicar limitações de dados.
- Explicar rankings.
- Explicar dados em atualização.
- Dar transparência para SEO e confiança do usuário.

---

## 7. Dados, Supabase e auditoria

### Supabase

URL base usada no projeto:

```txt
https://jznroxtulapmzhhcidtg.supabase.co
```

Importante:

```txt
Não usar /rest/v1/ em SUPABASE_URL.
```

### Tabelas principais

```txt
assets
asset_quotes
asset_price_history
asset_financials
asset_dividends
asset_indicators
```

Última validação técnica conhecida:

```txt
Supabase conectado: true
assets: OK
asset_quotes: OK
asset_price_history: OK
asset_financials: OK
asset_dividends: OK
asset_indicators: OK
```

### Endpoint de status

Rota:

```txt
/api/data/status
```

Função:

- Validar conexão Supabase.
- Confirmar tabelas.
- Informar snapshot local/remoto.
- Avisar se as páginas devem usar base completa.

### Endpoint de qualidade

Rota:

```txt
/api/data/quality
```

Resumo conhecido:

```txt
assetsTotal: 172
stocks: 123
fiis: 49
assetsWithQuote: 172
assetsWithHistory: 169
assetsWithIndicators: 172
assetsWithMarketCap: 166
```

Ativos com atenção:

```txt
AZUL4
BCFF11
CPLE6
IRDM11
PMLL11
```

Esses ativos não devem ser priorizados em destaque, nem receber prioridade alta de SEO, até ficarem consistentes.

---

## 8. Workflows GitHub Actions

Arquivos:

```txt
.github/workflows/update-acoes.yml
.github/workflows/update-fiis.yml
.github/workflows/update-cvm-semanal.yml
```

Funções:

- Atualizar ações.
- Atualizar FIIs.
- Atualizar fundamentos CVM semanalmente.
- Gerar/atualizar snapshots e relatórios.

Permissão necessária no GitHub:

```txt
Settings → Actions → General → Workflow permissions → Read and write permissions
```

Secrets GitHub necessários:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
BRAPI_API_TOKEN
```

---

## 9. Vercel

Configuração correta em:

```txt
Project Settings → Build and Deployment
```

Valores:

```txt
Framework Preset: Next.js
Root Directory: ./
Node.js Version: 24.x
Install Command: corepack enable && corepack prepare pnpm@10.14.0 --activate && pnpm install --no-frozen-lockfile
Build Command: pnpm run build
Output Directory: vazio
```

Não usar:

```txt
npm ci
```

O `npm ci` causou erro recorrente na Vercel:

```txt
npm error Exit handler never called!
```

A solução estabilizada foi usar pnpm.

### Variáveis recomendadas na Vercel

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
BRAPI_API_TOKEN
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SHOW_DATA_WARNINGS
MAPA_DO_ATIVO_BUILD_SKIP_EXTERNAL
```

Valores conceituais:

```txt
NEXT_PUBLIC_SHOW_DATA_WARNINGS=true
MAPA_DO_ATIVO_BUILD_SKIP_EXTERNAL=false
```

Em produção com domínio final, usar:

```txt
NEXT_PUBLIC_SITE_URL=https://www.mapadoativo.com.br
```

Enquanto estiver no domínio temporário da Vercel, usar a URL da Vercel.

---

## 10. SEO técnico

Arquivos/rotas:

```txt
/sitemap.xml
/robots.txt
```

Robots atual:

```txt
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /api/debug/
Disallow: /api/cache/

Sitemap: https://mapa-do-ativo.vercel.app/sitemap.xml
```

Quando configurar domínio final, atualizar `NEXT_PUBLIC_SITE_URL` e regerar o deploy para que sitemap e robots apontem para:

```txt
https://www.mapadoativo.com.br/sitemap.xml
```

### Observação sobre favicon no Google

Mesmo depois de o favicon estar correto no site, o Google pode demorar para atualizar o ícone nos resultados por cache e recrawling.

Validações pós-deploy:

```txt
/favicon.ico
/favicon-16x16.png
/favicon-32x32.png
/apple-touch-icon.png
/android-chrome-192x192.png
/android-chrome-512x512.png
/site.webmanifest
```

---

## 11. Histórico resumido de versões recentes

### v1.56.7

- Corrigiu erro TypeScript no histórico com volume.
- Publicada com sucesso na Vercel.
- Resolveu build quebrado.

### v1.56.8

- Corrigiu nomes públicos prioritários:
  - `BBAS3` → `Banco do Brasil ON`
  - `XPML11` → `XP Malls FII`
  - `MXRF11` → `Maxi Renda FII`
- Removeu imagem externa quebrada em FIIs.
- Ajustou classificação entre ações, FIIs e units.
- Ajustou diretórios e rankings.
- Removeu ativos em observação do sitemap.

### v1.56.9

- Adicionou favicon oficial completo.
- Criou `site.webmanifest`.
- Atualizou metadados no `app/layout.tsx`.
- Adicionou ícones para navegador, Google, mobile e App Router.

### v1.56.10

- Ajusta o ícone do header para corresponder ao mesmo estilo do favicon.
- Adiciona handoff completo de recuperação e continuidade.

---

## 12. Como restaurar o projeto do zero usando este backup

### 12.1 Pré-requisitos locais

Instalar:

```txt
Node.js compatível com 24.x
Git
VSCode
```

Não precisa instalar pnpm globalmente. Usar `npm exec`.

### 12.2 Restaurar a pasta local

Supondo que o backup esteja em Downloads:

```powershell
cd "C:\Users\38405395873\Documents\Web"

Remove-Item -Recurse "mapa-do-ativo" -Force -ErrorAction SilentlyContinue
Remove-Item -Recurse "_mapa_restore" -Force -ErrorAction SilentlyContinue

Expand-Archive -Path "$env:USERPROFILE\Downloads\mapa-do-ativo-v1-56-10-header-favicon-handoff.zip" -DestinationPath ".\_mapa_restore" -Force

Rename-Item ".\_mapa_restore\mapa-do-ativo-v1-56-10-header-favicon-handoff" "mapa-do-ativo"
Move-Item ".\_mapa_restore\mapa-do-ativo" ".\mapa-do-ativo"
Remove-Item -Recurse ".\_mapa_restore" -Force -ErrorAction SilentlyContinue

cd ".\mapa-do-ativo"
```

### 12.3 Recriar vínculo com GitHub se a pasta não tiver `.git`

Caminho recomendado:

```powershell
cd "C:\Users\38405395873\Documents\Web"

Rename-Item "mapa-do-ativo" "mapa-do-ativo-v15610-local"

git clone https://github.com/ricardoviscardi/mapa-do-ativo.git mapa-do-ativo

robocopy ".\mapa-do-ativo-v15610-local" ".\mapa-do-ativo" /E /XD .git node_modules .next /XF .env.local package-lock.json

cd ".\mapa-do-ativo"

git status
```

Observação importante:

```txt
.github não é .git.
.github contém workflows.
.git é o vínculo local com o repositório.
```

---

## 13. Como aplicar esta versão no GitHub

Se a pasta local já estiver com `.git` correto:

```powershell
cd "C:\Users\38405395873\Documents\Web\mapa-do-ativo"

git status
```

Copiar o conteúdo do backup para dentro da pasta Git, sem apagar `.git`:

```powershell
cd "C:\Users\38405395873\Documents\Web"

Remove-Item -Recurse "_mapa_v15610" -Force -ErrorAction SilentlyContinue

Expand-Archive -Path "$env:USERPROFILE\Downloads\mapa-do-ativo-v1-56-10-header-favicon-handoff.zip" -DestinationPath ".\_mapa_v15610" -Force

robocopy ".\_mapa_v15610\mapa-do-ativo-v1-56-10-header-favicon-handoff" ".\mapa-do-ativo" /E /XD .git node_modules .next /XF .env.local package-lock.json

cd ".\mapa-do-ativo"

git status
```

Testar build:

```powershell
Remove-Item -Recurse node_modules,.next -Force -ErrorAction SilentlyContinue
Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue

npm exec --yes --package=pnpm@10.14.0 -- pnpm install --no-frozen-lockfile
npm exec --yes --package=pnpm@10.14.0 -- pnpm run build
```

Commit e push:

```powershell
git status
git add -A
git commit -m "feat: alinha header ao favicon oficial"
git pull --rebase origin main
git push origin main
```

---

## 14. Checklist de validação após deploy

### Deploy

```txt
Vercel → Deployments → último deploy → Ready → Production
```

### Rotas públicas

```txt
/
/acoes
/fiis
/rankings
/ferramentas
/comparador
/glossario
/metodologia
/sobre
/contato
```

### Ativos prioritários

```txt
/acoes/petr4
/acoes/vale3
/acoes/bbas3
/fiis/xpml11
/fiis/mxrf11
```

### Técnicas

```txt
/api/data/status
/api/data/quality
/sitemap.xml
/robots.txt
```

### Favicon e ícones

```txt
/favicon.ico
/favicon-16x16.png
/favicon-32x32.png
/apple-touch-icon.png
/android-chrome-192x192.png
/android-chrome-512x512.png
/site.webmanifest
```

### Header

Confirmar visualmente:

```txt
O ícone ao lado de “Mapa do Ativo” no header deve usar o mesmo monograma visual do favicon, e não o MA textual simples antigo.
```

---

## 15. Próximo passo recomendado após publicar a v1.56.10

Depois de aplicar, testar build, fazer push e validar o deploy na Vercel:

1. Configurar domínio final:

```txt
mapadoativo.com.br
www.mapadoativo.com.br
```

2. Atualizar na Vercel:

```txt
NEXT_PUBLIC_SITE_URL=https://www.mapadoativo.com.br
```

3. Fazer novo deploy.

4. Validar:

```txt
https://www.mapadoativo.com.br/sitemap.xml
https://www.mapadoativo.com.br/robots.txt
https://www.mapadoativo.com.br/favicon.ico
```

5. Enviar sitemap no Google Search Console.

6. Solicitar indexação das páginas principais.

7. Rotacionar chaves/tokens que possam ter sido expostos durante conversas anteriores.

---

## 16. Observações de segurança

- Nunca colocar `SUPABASE_SERVICE_ROLE_KEY` em variável pública `NEXT_PUBLIC_*`.
- Nunca commitar `.env.local`.
- Rotacionar chaves coladas em conversas ou prints.
- Manter `BRAPI_API_TOKEN` apenas como secret no GitHub/Vercel.
- Bloquear `/api/` no robots, como já está.

---

## 17. Resumo final para nova conversa

Cole este resumo na próxima conversa:

```txt
Estou continuando o projeto Mapa do Ativo. A última versão é v1.56.10 — header alinhado ao favicon + handoff de recuperação. Tenho o backup mapa-do-ativo-v1-56-10-header-favicon-handoff.zip e o handoff completo. O próximo passo é aplicar o backup na pasta Git correta, testar o build com pnpm, fazer commit/push e validar o deploy na Vercel. Depois disso, configurar o domínio final mapadoativo.com.br, atualizar NEXT_PUBLIC_SITE_URL e enviar o sitemap ao Google Search Console.
```

---

## 18. Arquivos desta entrega

```txt
mapa-do-ativo-v1-56-10-header-favicon-handoff.zip
HANDOFF_MAPA_DO_ATIVO_v1_56_10_COMPLETO.md
```

Com esses dois arquivos, é possível retomar a continuidade ou reconstruir a versão v1.56.10 do projeto com segurança.
