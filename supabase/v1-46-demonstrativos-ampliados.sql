-- Mapa do Ativo v1.46
-- Execute uma vez no SQL Editor do Supabase antes de rodar a rotina completa de ações.

alter table public.asset_financials
  add column if not exists non_current_assets numeric,
  add column if not exists cash_and_equivalents numeric,
  add column if not exists current_liabilities numeric,
  add column if not exists non_current_liabilities numeric,
  add column if not exists short_term_debt numeric,
  add column if not exists long_term_debt numeric,
  add column if not exists cost_of_revenue numeric,
  add column if not exists operating_expenses numeric,
  add column if not exists financial_result numeric,
  add column if not exists income_before_tax numeric,
  add column if not exists income_tax numeric,
  add column if not exists investing_cash_flow numeric,
  add column if not exists financing_cash_flow numeric,
  add column if not exists dividends_paid numeric,
  add column if not exists net_change_cash numeric;

create index if not exists idx_asset_financials_ticker_reference_date
  on public.asset_financials(ticker, reference_date desc);
