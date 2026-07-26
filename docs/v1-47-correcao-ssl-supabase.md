# v1.47 — Correção para falha SSL/TLS no Supabase

## Erro

```text
[SSL: SSLV3_ALERT_HANDSHAKE_FAILURE] sslv3 alert handshake failure
```

Isso normalmente é ambiente/rede entre Python/Windows e Supabase.

## Atualize bibliotecas

```bash
python -m pip install --upgrade pip certifi requests urllib3
```

Feche e reabra o PowerShell.

## Teste conexão

```bash
python scripts/check_supabase_connection.py
```

## Rodar em partes

Só CVM:

```bash
python scripts/update_all_stocks_full.py --skip-prices --with-itr
```

Completo, mas continua se preço falhar:

```bash
python scripts/update_all_stocks_full.py --with-itr --prices-optional
```

Só preços:

```bash
python scripts/update_all_stocks_full.py --skip-cvm
```
