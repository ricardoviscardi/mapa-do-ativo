-- Mapa do Ativo - schema inicial de custo mínimo
-- Execute no SQL Editor do Supabase.

create table if not exists public.assets (
  id bigserial primary key,
  ticker text not null unique,
  kind text not null check (kind in ('stock', 'fii')),
  name text,
  company_name text,
  cnpj text,
  cvm_code integer,
  sector text,
  industry text,
  segment text,
  website text,
  currency text default 'BRL',
  source text,
  updated_at timestamptz default now()
);

create table if not exists public.asset_quotes (
  id bigserial primary key,
  ticker text not null references public.assets(ticker) on delete cascade,
  price numeric,
  change_value numeric,
  change_percent numeric,
  open numeric,
  high numeric,
  low numeric,
  previous_close numeric,
  volume numeric,
  market_cap numeric,
  quote_date timestamptz,
  source text,
  updated_at timestamptz default now()
);

create table if not exists public.asset_price_history (
  id bigserial primary key,
  ticker text not null references public.assets(ticker) on delete cascade,
  date date not null,
  close numeric not null,
  volume numeric,
  source text,
  updated_at timestamptz default now(),
  unique (ticker, date)
);

create table if not exists public.asset_financials (
  id bigserial primary key,
  ticker text not null references public.assets(ticker) on delete cascade,
  period_type text not null check (period_type in ('annual', 'quarterly')),
  reference_year int,
  reference_period text,
  reference_date date,
  total_assets numeric,
  current_assets numeric,
  total_liabilities numeric,
  equity numeric,
  revenue numeric,
  gross_profit numeric,
  ebit numeric,
  ebitda numeric,
  net_income numeric,
  operating_cash_flow numeric,
  capex numeric,
  free_cash_flow numeric,
  source text,
  updated_at timestamptz default now(),
  unique (ticker, period_type, reference_year, reference_period)
);

create table if not exists public.asset_dividends (
  id bigserial primary key,
  ticker text not null references public.assets(ticker) on delete cascade,
  type text,
  value numeric,
  com_date date,
  payment_date date,
  source text,
  updated_at timestamptz default now()
);

create table if not exists public.asset_indicators (
  id bigserial primary key,
  ticker text not null references public.assets(ticker) on delete cascade,
  reference_date date not null,
  pe numeric,
  pvp numeric,
  dividend_yield numeric,
  roe numeric,
  roa numeric,
  roic numeric,
  net_margin numeric,
  ev_ebitda numeric,
  debt_ebitda numeric,
  book_value_per_share numeric,
  market_cap numeric,
  shares_outstanding numeric,
  vp_per_share numeric,
  dividend_per_share numeric,
  source text,
  updated_at timestamptz default now(),
  unique (ticker, reference_date)
);

create index if not exists idx_assets_kind on public.assets(kind);
create index if not exists idx_assets_cvm_code on public.assets(cvm_code);
create index if not exists idx_asset_price_history_ticker_date on public.asset_price_history(ticker, date desc);
create index if not exists idx_asset_financials_ticker_period on public.asset_financials(ticker, period_type, reference_year desc);
create index if not exists idx_asset_dividends_ticker_payment on public.asset_dividends(ticker, payment_date desc);
create index if not exists idx_asset_indicators_ticker_date on public.asset_indicators(ticker, reference_date desc);
