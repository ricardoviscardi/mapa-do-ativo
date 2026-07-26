import type { StockFinancialRow } from "@/types/stock";
import { Card } from "@/components/ui/Card";

type DayQuoteCardProps = {
  rows: StockFinancialRow[];
};

export function DayQuoteCard({ rows }: DayQuoteCardProps) {
  return (
    <Card>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
        Cotação do dia
      </p>

      <div className="mt-5 grid gap-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-3 last:border-b-0 last:pb-0">
            <p className="text-sm text-[var(--color-muted)]">{row.label}</p>
            <p className="text-right text-sm font-bold text-[var(--color-text)]">
              {row.value}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
