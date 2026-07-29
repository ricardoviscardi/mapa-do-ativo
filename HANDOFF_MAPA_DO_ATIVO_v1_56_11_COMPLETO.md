# HANDOFF COMPLETO — MAPA DO ATIVO v1.56.11

> Documento de continuidade e recuperação do projeto.  
> Objetivo: publicar e manter a versão com Google Analytics 4, consentimento de cookies e política de privacidade revisada.

---

## 1. Identificação

**Projeto:** Mapa do Ativo  
**Slogan:** Do ativo ao patrimônio.  
**Contato:** contato@mapadoativo.com.br  
**Repositório:** `https://github.com/ricardoviscardi/mapa-do-ativo`  
**Vercel:** projeto `mapa-do-ativo`  
**Domínio principal:** `https://www.mapadoativo.com.br`  
**Versão:** `v1.56.11 — Google Analytics 4 + consentimento de cookies`

**Backup desta entrega:**

```text
mapa-do-ativo-v1-56-11-analytics-consent.zip
```

---

## 2. O que muda na v1.56.11

A versão adiciona medição analítica condicionada ao consentimento do visitante.

### Entregas principais

- Google Analytics 4 configurado pela variável:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-2W57T8JENK
```

- Consentimento analítico definido como `denied` antes de qualquer comando de medição.
- A tag `gtag.js` só é carregada após o visitante aceitar.
- Banner responsivo com:
  - Aceitar analíticos;
  - Recusar analíticos;
  - acesso à Política de Privacidade.
- Preferência armazenada no navegador.
- Botão permanente “Preferências de cookies” no rodapé.
- Opção de revogar o consentimento posteriormente.
- Rastreamento de visualizações durante a navegação interna do App Router.
- Recursos publicitários mantidos desativados:
  - `ad_storage: denied`;
  - `ad_user_data: denied`;
  - `ad_personalization: denied`;
  - Google Signals desativado.
- Página `/privacidade` revisada.

---

## 3. Arquivos novos

```text
components/analytics/GoogleAnalytics.tsx
components/analytics/GoogleConsentDefaults.tsx
components/privacy/consent.ts
components/privacy/CookieConsentBanner.tsx
components/privacy/CookiePreferencesButton.tsx
HANDOFF_MAPA_DO_ATIVO_v1_56_11_COMPLETO.md
```

## 4. Arquivos alterados

```text
app/layout.tsx
app/privacidade/page.tsx
components/layout/Footer.tsx
components/legal/LegalPage.tsx
.env.example
README.md
package.json
VERSAO.md
```

---

## 5. Como funciona o consentimento

### Primeira visita

1. O estado padrão do Consent Mode é definido como negado.
2. O banner aparece.
3. Enquanto não houver aceite, a tag do Analytics não é carregada.
4. Ao aceitar, o site:
   - salva `granted` no `localStorage`;
   - atualiza `analytics_storage` para `granted`;
   - carrega `gtag.js`;
   - envia eventos de visualização de página.
5. Ao recusar, o site mantém o Analytics desativado.

### Alteração posterior

O visitante pode abrir:

```text
Rodapé → Preferências de cookies
```

Ao revogar um aceite anterior, o site interrompe novos eventos e tenta remover cookies iniciados por `_ga` no domínio.

### Chave local usada

```text
mapa-do-ativo-analytics-consent-v1
```

---

## 6. Variáveis da Vercel

Confirmar em:

```text
Vercel → mapa-do-ativo → Settings → Environment Variables
```

Valores necessários:

```env
NEXT_PUBLIC_SITE_URL=https://www.mapadoativo.com.br
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-2W57T8JENK
```

A variável do Analytics pode ficar em:

```text
Production and Preview
```

O ID `G-2W57T8JENK` é público; não precisa ser marcado como segredo.

As demais variáveis do projeto continuam necessárias:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
BRAPI_API_TOKEN=
NEXT_PUBLIC_SHOW_DATA_WARNINGS=false
MAPA_DO_ATIVO_BUILD_SKIP_EXTERNAL=false
```

Nunca expor `SUPABASE_SERVICE_ROLE_KEY` em variável `NEXT_PUBLIC_*`.

---

## 7. Como aplicar o ZIP na pasta Git existente

No PowerShell:

```powershell
cd "$env:USERPROFILE\Documents\Web"

Remove-Item -Recurse "_mapa_v15611" -Force -ErrorAction SilentlyContinue

Expand-Archive `
  -Path "$env:USERPROFILE\Downloads\mapa-do-ativo-v1-56-11-analytics-consent.zip" `
  -DestinationPath ".\_mapa_v15611" `
  -Force

robocopy `
  ".\_mapa_v15611\mapa-do-ativo-v1-56-11-analytics-consent" `
  ".\mapa-do-ativo" `
  /E `
  /XD .git node_modules .next `
  /XF .env .env.local package-lock.json

cd ".\mapa-do-ativo"
git status
```

O `robocopy` pode retornar códigos entre 0 e 7 mesmo quando concluiu corretamente.

---

## 8. Teste local obrigatório

```powershell
Remove-Item -Recurse node_modules,.next -Force -ErrorAction SilentlyContinue
Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue

npm exec --yes --package=pnpm@10.14.0 -- pnpm install --no-frozen-lockfile
npm exec --yes --package=pnpm@10.14.0 -- pnpm run build
```

Para testar o banner localmente, crie ou ajuste `.env.local`:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-2W57T8JENK
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Depois:

```powershell
npm exec --yes --package=pnpm@10.14.0 -- pnpm run dev
```

Abrir:

```text
http://localhost:3000
http://localhost:3000/privacidade
```

---

## 9. Commit e push

Depois de o build terminar sem erros:

```powershell
git status
git add -A
git diff --cached --stat
git commit -m "feat: adiciona Google Analytics com consentimento"
git pull --rebase origin main
git push origin main
```

Tag recomendada:

```powershell
git tag -a v1.56.11 -m "Mapa do Ativo v1.56.11"
git push origin v1.56.11
```

---

## 10. Validação após o deploy

### Vercel

Confirmar:

```text
Deployments → último deploy → Ready → Production
```

### Site

Testar em uma janela anônima:

```text
https://www.mapadoativo.com.br
```

Checklist:

1. O banner aparece na primeira visita.
2. O site funciona normalmente sem aceitar.
3. Ao clicar em “Recusar analíticos”, o banner fecha.
4. No rodapé, “Preferências de cookies” reabre o banner.
5. Ao aceitar, a escolha fica salva após atualizar a página.
6. `/privacidade` abre e contém a política atualizada.
7. O site continua funcionando em dispositivos móveis.

### Analytics

Depois de aceitar:

1. Abrir algumas páginas do site.
2. No Google Analytics, acessar:

```text
Relatórios → Tempo real
```

3. Confirmar atividade na propriedade Mapa do Ativo.
4. Usar “Testar instalação” ou Tag Assistant.

### Teste de recusa

Em DevTools → Network, procurar:

```text
gtag/js
```

Antes do aceite, essa requisição não deve aparecer nesta implementação.

---

## 11. Search Console

Propriedade recomendada:

```text
mapadoativo.com.br
```

Tipo:

```text
Domínio
```

Depois da verificação DNS, enviar:

```text
sitemap.xml
```

Validar:

```text
https://www.mapadoativo.com.br/sitemap.xml
https://www.mapadoativo.com.br/robots.txt
```

O `robots.txt` deve apontar o sitemap para o domínio definitivo.

---

## 12. Vincular Analytics e Search Console

Depois que ambos estiverem funcionando:

```text
Google Analytics → Administrador → Vinculações de produtos → Search Console
```

Selecionar a propriedade:

```text
mapadoativo.com.br
```

E o fluxo:

```text
Mapa do Ativo – Produção
```

---

## 13. Observações técnicas

- Não foi adicionado pacote novo ao `package.json`.
- A integração usa os recursos já existentes do Next.js e carregamento controlado da tag.
- A ausência de `NEXT_PUBLIC_GA_MEASUREMENT_ID` não quebra o site; apenas impede a carga do Analytics.
- O banner continua disponível mesmo sem ID, permitindo manter o fluxo de consentimento pronto.
- A preferência fica somente no navegador atual; outro navegador ou dispositivo solicitará nova escolha.
- A limpeza de cookies após revogação é uma tentativa de remoção dos cookies `_ga` acessíveis pelo domínio.

---

## 14. Segurança e privacidade

- Não versionar `.env.local`.
- Não colocar tokens privados em variáveis `NEXT_PUBLIC_*`.
- Não incluir `SUPABASE_SERVICE_ROLE_KEY` no navegador.
- Rotacionar chaves que tenham sido expostas em conversas ou capturas.
- Revisar periodicamente a política de privacidade caso novos fornecedores ou tipos de coleta sejam adicionados.

---

## 15. Próximos passos recomendados

Após validar Analytics e Search Console:

1. Conferir dados em Tempo real.
2. Vincular Search Console ao GA4.
3. Aguardar a indexação inicial.
4. Revisar desempenho, Core Web Vitals e páginas indexadas após alguns dias.
5. Configurar eventos próprios apenas quando houver objetivo claro, como uso do comparador ou das calculadoras.

---

## 16. Resumo para uma nova conversa

```text
Estou continuando o Mapa do Ativo. A última versão é v1.56.11 — Google Analytics 4 + consentimento de cookies. O domínio oficial é https://www.mapadoativo.com.br e o ID GA4 é G-2W57T8JENK. O projeto já possui banner de consentimento, Consent Mode com Analytics negado por padrão, carregamento da tag apenas após aceite, preferências no rodapé e política de privacidade atualizada. O próximo passo é aplicar o ZIP na pasta Git, rodar o build, fazer push, validar o deploy e testar o relatório Tempo real.
```
