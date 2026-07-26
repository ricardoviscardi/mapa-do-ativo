import type { DividendSummary } from "@/types/stock";
import { Card } from "@/components/ui/Card";

type DividendSummaryCardProps = {
  summary: DividendSummary;
};

export function DividendSummaryCard({ summary }: DividendSummaryCardProps) {
  const hasYield = summary.yield12m !== "Não disponível";

  return (
    <Card>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
        Dividendos 12m
      </p>

      <div className="mt-5">
        <p
          className={
            hasYield
              ? "text-4xl font-bold text-[var(--color-positive)]"
              : "text-2xl font-bold text-[var(--color-text)]"
          }
        >
          {hasYield ? summary.yield12m : "Em consolidação"}
        </p>
        <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
          {summary.cash12m === "Não disponível"
            ? "Histórico recente"
            : summary.cash12m}
        </p>
        <p className="mt-3 text-xs leading-5 text-[var(--color-muted)]">
          Dividend yield saneado dos últimos 12 meses. Eventos atípicos, não recorrentes
          ou incompatíveis com a série do ativo são ocultados para evitar
          distorções.
        </p>
      </div>
    </Card>
  );
}
