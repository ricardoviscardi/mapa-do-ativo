# v1.41 — Base inicial em massa

## Objetivo

Preparar a Camada 2 do Mapa do Ativo: uma base ampliada de ações e FIIs para reduzir páginas vazias após a publicação.

## O que foi adicionado

- Lista ampliada de ações e FIIs em `scripts/tickers.py`.
- Script de atualização em massa: `scripts/update_base_inicial.py`.
- Relatório automático em `reports/update-base-*.json` e `reports/update-base-*.csv`.
- Atualização rápida diária continua disponível via `scripts/update_prices_yahoo.py`.

## Comandos principais

Atualizar somente a base principal validada:

```bash
python scripts/update_base_inicial.py --core
```

Atualizar a base ampliada completa:

```bash
python scripts/update_base_inicial.py --all
```

Atualizar somente ações:

```bash
python scripts/update_base_inicial.py --stocks
```

Atualizar somente FIIs:

```bash
python scripts/update_base_inicial.py --fiis
```

Testar com poucos ativos:

```bash
python scripts/update_base_inicial.py --all --limit 20
```

## Observações

- Alguns ativos podem falhar por ausência de cobertura na fonte pública. Isso é esperado.
- Falhas são registradas no relatório e não interrompem o processamento dos demais ativos.
- A base ampliada não substitui a etapa CVM oficial. Ela melhora a cobertura inicial de cotação, histórico, proventos e alguns indicadores.

## Próximo passo

v1.42 — Rankings com base ampliada e relatório de qualidade dos dados.
