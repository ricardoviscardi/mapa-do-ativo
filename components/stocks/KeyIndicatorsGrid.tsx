import type { StockIndicator } from "@/types/stock";
import { Card } from "@/components/ui/Card";

type KeyIndicatorsGridProps = {
  indicators: StockIndicator[];
};

const unavailableValues = new Set(["", "—", "-", "Não disponível", "NaN"]);

function hasUsefulValue(value: string | null | undefined) {
  return Boolean(value && !unavailableValues.has(value.trim()));
}

export function KeyIndicatorsGrid({ indicators }: KeyIndicatorsGridProps) {
  const visibleIndicators = indicators.filter((indicator) => hasUsefulValue(indicator.value));

  return (
    <Card>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
        Indicadores-chave
      </p>

      <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-7 md:grid-cols-3 xl:grid-cols-4">
        {visibleIndicators.map((indicator) => (
          <div key={indicator.label}>
            <p className="text-xs font-medium text-[var(--color-muted)]">
              {indicator.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">
              {indicator.value}
            </p>
            <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-[var(--color-muted)]">
              {indicator.description}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
