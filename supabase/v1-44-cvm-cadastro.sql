-- Mapa do Ativo v1.44
-- Execute uma vez no SQL Editor do Supabase antes de rodar scripts/update_cvm_companies.py.

alter table public.assets
  add column if not exists cvm_code integer;

create index if not exists idx_assets_cvm_code on public.assets(cvm_code);

create unique index if not exists idx_asset_financials_unique_period
  on public.asset_financials(ticker, period_type, reference_year, reference_period);

create unique index if not exists idx_asset_indicators_unique_reference
  on public.asset_indicators(ticker, reference_date);
