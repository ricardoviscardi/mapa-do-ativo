# Mapa do Ativo v1.51
# Remove arquivo antigo que causa:
# Duplicate page detected: pages\api\internal\supabase-proxy.ts and app\api\internal\supabase-proxy\route.ts

$oldProxy = Join-Path (Get-Location) "app\api\internal\supabase-proxy"

if (Test-Path $oldProxy) {
  Remove-Item -Recurse -Force $oldProxy
  Write-Host "Proxy antigo removido: $oldProxy"
} else {
  Write-Host "Proxy antigo não encontrado. Nenhuma limpeza necessária."
}

$nextCache = Join-Path (Get-Location) ".next"

if (Test-Path $nextCache) {
  Remove-Item -Recurse -Force $nextCache
  Write-Host "Cache .next removido."
} else {
  Write-Host "Cache .next não encontrado."
}

Write-Host "Limpeza concluída. Agora rode: npm run dev"
