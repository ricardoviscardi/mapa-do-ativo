# Como configurar o GitHub Actions do Mapa do Ativo

## 1. Subir o projeto para o GitHub

```bash
git status
git add .
git commit -m "v1.53 github actions para atualizacao de acoes"
git push
```

## 2. Criar secrets

No GitHub:

```text
Repository > Settings > Secrets and variables > Actions > New repository secret
```

Crie:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Opcional:

```text
BRAPI_API_TOKEN
```

## 3. Rodar a atualização

```text
Actions > Atualizar ações > Run workflow
```

Escolha primeiro:

```text
completo_sem_itr
```

Depois, se quiser trimestrais:

```text
completo_com_itr
```

## 4. Conferir resultado

Ao final da action, ela roda:

```bash
python scripts/check_supabase_data.py
```

A contagem deve subir principalmente em:

```text
asset_quotes
asset_price_history
asset_financials
asset_indicators
asset_dividends
```
