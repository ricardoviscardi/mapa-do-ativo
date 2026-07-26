# Arquitetura de custo mínimo do Mapa do Ativo

## Objetivo

Reduzir dependência de APIs pagas enquanto o projeto ainda valida tráfego, SEO e interesse real dos usuários.

## Estratégia

O Mapa do Ativo passa a evoluir para este fluxo:

```text
CVM Dados Abertos + Yahoo/yfinance
        ↓
Scripts Python de atualização
        ↓
Supabase/Postgres
        ↓
Next.js consulta nossa base própria
```

## O que fica fora por enquanto

Indicadores de FIIs baseados em FFO ficam ocultos por enquanto:

- FFO Yield
- FFO/Cota
- FFO 12m

Motivo: esses campos exigem tratamento mais delicado e podem gerar inconsistência. Eles podem voltar no futuro quando o projeto tiver receita para contratar uma API mais robusta.

## Fontes por tipo de dado

### Ações

- Cotação: Yahoo/yfinance como fonte barata inicial.
- Histórico de preço: Yahoo/yfinance.
- Balanço, DRE e fluxo de caixa: CVM DFP/ITR.
- Indicadores: calculados a partir de cotação + dados CVM.
- Dividendos: Yahoo/yfinance inicialmente; futuramente uma fonte mais robusta.

### FIIs

- Cotação: Yahoo/yfinance.
- Histórico de preço: Yahoo/yfinance.
- Patrimônio líquido, número de cotas e informes: CVM Dados Abertos.
- Dividend yield: rendimento 12m dividido pela cotação.
- P/VP: cotação dividida pelo VP/Cota.
- VP/Cota: patrimônio líquido dividido pelo número de cotas.
- FFO: oculto nesta fase.

## Infraestrutura inicial

- Frontend/site: Next.js.
- Banco: Supabase/Postgres.
- Robô de atualização: GitHub Actions rodando Python.
- Hospedagem: Vercel ou similar.
- Cache: Supabase + cache server-side do Next.

## Próximas versões sugeridas

### v1.31 — Supabase schema

Criar tabelas definitivas e adaptar o site para ler do Supabase primeiro.

### v1.32 — Python updater

Criar scripts Python para baixar CVM/Yahoo e salvar no Supabase.

### v1.33 — GitHub Actions

Automatizar atualização diária/semanal.

### v1.34 — Deploy

Subir para Vercel com domínio, Search Console e Analytics.
