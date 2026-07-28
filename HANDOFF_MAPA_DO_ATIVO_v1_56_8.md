# HANDOFF — Mapa do Ativo v1.56.8

## Objetivo

Polimento final após deploy bem-sucedido da v1.56.7 na Vercel, antes de divulgação oficial e envio ao Google Search Console.

## Alterações aplicadas

1. **Nomes públicos prioritários**
   - `BBAS3` passa a exibir `Banco do Brasil ON`.
   - `XPML11` passa a exibir `XP Malls FII`.
   - `MXRF11` passa a exibir `Maxi Renda FII`.

2. **Fallback visual em FIIs**
   - Páginas de FIIs deixam de tentar renderizar logo externo quando a fonte retorna imagem instável.
   - O topo usa fallback textual com as duas primeiras letras do ticker.

3. **Classificação de tipo de ativo**
   - Criada classificação centralizada em `lib/stocks/asset-display.ts`.
   - Evita tratar units de ações como FIIs só porque terminam em `11`.
   - Exemplos tratados como ações: `BPAC11`, `ENGI11`, `KLBN11`, `SANB11`, `SAPR11`, `TAEE11`.

4. **Diretórios e rankings**
   - Diretórios e rankings usam a classificação centralizada.
   - Nomes exibidos usam a camada pública de apresentação.
   - Texto do contador mudou para “ativos monitorados no diretório”.

5. **Sitemap mais conservador**
   - Tickers em observação removidos temporariamente do sitemap:
     - `AZUL4`
     - `CPLE6`
     - `BCFF11`
     - `IRDM11`
     - `PMLL11`

## Comandos recomendados

```powershell
cd "C:\Users\38405395873\Documents\Web\mapa-do-ativo"

Remove-Item -Recurse node_modules,.next -Force -ErrorAction SilentlyContinue
Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue

npm exec --yes --package=pnpm@10.14.0 -- pnpm install --no-frozen-lockfile
npm exec --yes --package=pnpm@10.14.0 -- pnpm run build
```

## Commit sugerido

```powershell
git status
git add -A
git commit -m "fix: polimento final de nomes fiis e sitemap"
git pull --rebase origin main
git push origin main
```

## Pós-deploy

Validar:

```text
/acoes/bbas3
/fiis/xpml11
/fiis/mxrf11
/acoes
/fiis
/rankings
/comparador
/sitemap.xml
/robots.txt
/api/data/status
/api/data/quality
```

## Próxima etapa

Após aprovar em Vercel:

1. Configurar domínio final `mapadoativo.com.br`.
2. Atualizar `NEXT_PUBLIC_SITE_URL` para o domínio final.
3. Fazer novo deploy.
4. Enviar sitemap no Google Search Console.
