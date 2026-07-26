import Image from "next/image";
import type { StockData } from "@/types/stock";
import { formatCurrency, formatPercent, toFiniteNumber } from "@/lib/utils/formatters";
import { displayAssetName, displayAssetSubtitle } from "@/lib/stocks/asset-display";

type StockHeaderProps = {
  stock: StockData;
};

export function StockHeader({ stock }: StockHeaderProps) {
  const latestHistoryPrice = stock.history.at(-1)?.close ?? null;
  const displayPrice = toFiniteNumber(stock.quote.price) ?? toFiniteNumber(latestHistoryPrice);
  const displayChangeValue = toFiniteNumber(stock.quote.changeValue);
  const displayChangePercent = toFiniteNumber(stock.quote.changePercent);
  const hasVariation = displayChangeValue !== null && displayChangePercent !== null;
  const isPositive = (displayChangePercent ?? 0) >= 0;
  const companyName = displayAssetName(stock);
  const subtitle = displayAssetSubtitle(stock);
  const sector = subtitle.sector;
  const subsector = subtitle.subsector ?? "";

  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
        <div className="flex min-w-0 items-start gap-4">
          {stock.logoUrl ? (
            <Image
              src={stock.logoUrl}
              alt={`Logo ${companyName}`}
              width={52}
              height={52}
              className="rounded-2xl border border-[var(--color-border)] bg-white"
            />
          ) : (
            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[var(--color-background-alt)] text-sm font-bold text-[var(--color-primary)]">
              {stock.ticker.slice(0, 2)}
            </div>
          )}

          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
              B3:{stock.ticker}
            </p>
            <h1 className="mt-2 break-words text-3xl font-bold tracking-tight md:text-5xl">
              {companyName}
            </h1>
            <p className="mt-3 text-[var(--color-muted)]">
              {sector}
              {subsector ? ` • ${subsector}` : ""}
            </p>
          </div>
        </div>

        <div className="text-left md:text-right">
          <p className="text-sm text-[var(--color-muted)]">Cotação atual</p>
          <p className="mt-1 text-4xl font-bold text-[var(--color-text)]">
            {formatCurrency(displayPrice)}
          </p>
          {hasVariation ? (
            <p
              className={
                isPositive
                  ? "mt-2 text-base font-semibold text-[var(--color-positive)]"
                  : "mt-2 text-base font-semibold text-[var(--color-negative)]"
              }
            >
              {formatCurrency(displayChangeValue)} ({formatPercent(displayChangePercent)})
            </p>
          ) : (
            <p className="mt-2 text-base font-semibold text-[var(--color-muted)]">
              Variação não disponível
            </p>
          )}
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            Atualizado em {stock.updatedAt}
          </p>
        </div>
      </div>
    </div>
  );
}
