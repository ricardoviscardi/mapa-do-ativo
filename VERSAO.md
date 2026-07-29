# Versão atual — v1.56.11

## v1.56.11 — Google Analytics 4 + consentimento de cookies

Versão completa para substituição total dos arquivos do projeto **Mapa do Ativo**, baseada na v1.56.10.

### Novidades desta versão

- Integra o Google Analytics 4 por meio da variável pública:
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- Mantém o consentimento analítico negado por padrão antes de qualquer comando de medição.
- Carrega a tag do Google somente depois que o visitante aceita cookies analíticos.
- Registra visualizações de páginas também durante navegação interna do App Router.
- Mantém desativados:
  - armazenamento publicitário;
  - personalização de anúncios;
  - envio de dados para anúncios;
  - Google Signals.
- Adiciona banner de consentimento responsivo com:
  - `Aceitar analíticos`;
  - `Recusar analíticos`;
  - acesso à Política de Privacidade.
- Armazena a preferência no navegador e permite alterá-la posteriormente.
- Adiciona `Preferências de cookies` no rodapé.
- Atualiza integralmente `/privacidade` com informações sobre dados técnicos, Analytics, fornecedores, retenção e direitos do titular.
- Ao revogar o consentimento, interrompe novos eventos e tenta remover cookies `_ga` do domínio.

### Arquivos novos

- `components/analytics/GoogleAnalytics.tsx`
- `components/analytics/GoogleConsentDefaults.tsx`
- `components/privacy/consent.ts`
- `components/privacy/CookieConsentBanner.tsx`
- `components/privacy/CookiePreferencesButton.tsx`

### Arquivos alterados

- `app/layout.tsx`
- `app/privacidade/page.tsx`
- `components/layout/Footer.tsx`
- `components/legal/LegalPage.tsx`
- `.env.example`
- `README.md`
- `package.json`
- `VERSAO.md`

### Configuração necessária na Vercel

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-2W57T8JENK
NEXT_PUBLIC_SITE_URL=https://www.mapadoativo.com.br
```

Depois de salvar a variável, é necessário publicar esta versão ou fazer um novo deploy. O Analytics só começa a coletar após o visitante aceitar os cookies analíticos.

### Validação pós-deploy

1. Abrir o site em janela anônima.
2. Confirmar que o banner aparece.
3. Recusar e verificar que a tag `gtag/js` não é carregada.
4. Reabrir `Preferências de cookies` e aceitar.
5. Navegar entre algumas páginas.
6. Conferir `Tempo real` no Google Analytics.
7. Usar o Tag Assistant para validar os estados de consentimento.

### Arquivos propositalmente não incluídos

- `node_modules/`
- `.next/`
- `.env.local`
- `package-lock.json`
- arquivos de cache TypeScript
- `__pycache__/` e `*.pyc`
