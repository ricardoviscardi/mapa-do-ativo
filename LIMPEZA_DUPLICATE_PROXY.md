# Correção do erro Duplicate page detected

## Erro

```text
Duplicate page detected. pages\api\internal\supabase-proxy.ts and app\api\internal\supabase-proxy\route.ts resolve to /api/internal/supabase-proxy
```

## Motivo

A v1.50 mudou o proxy para:

```text
pages/api/internal/supabase-proxy.ts
```

Mas, se a nova pasta foi copiada por cima da antiga, o arquivo antigo pode ter ficado sobrando em:

```text
app/api/internal/supabase-proxy/route.ts
```

O Windows não apaga arquivos antigos quando você apenas cola uma pasta por cima.

## Correção rápida

No PowerShell, dentro da pasta do projeto:

```powershell
.\scripts\cleanup_duplicate_proxy.ps1
npm run dev
```

## Correção manual

Apague esta pasta:

```text
app/api/internal/supabase-proxy
```

Depois apague também a pasta `.next` e rode:

```bash
npm run dev
```
