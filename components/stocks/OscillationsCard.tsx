import type { StockOscillation } from "@/types/stock";
import { Card } from "@/components/ui/Card";

type OscillationsCardProps = {
  oscillations: StockOscillation[];
};

function valueClass(status: StockOscillation["status"]): string {
  if (status === "positive") return "font-bold text-[var(--color-positive)]";
  if (status === "negative") return "font-bold text-[var(--color-negative)]";
  return "font-bold text-[var(--color-text)]";
}

export function OscillationsCard({ oscillations }: OscillationsCardProps) {
  return (
    <Card>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
        Oscilações
      </p>
      <h2 className="mt-2 text-xl font-bold">Variação do preço</h2>

      <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--color-border)]">
        <div className="grid grid-cols-2 bg-[var(--color-background-alt)] text-sm sm:grid-cols-5">
          {oscillations.map((item) => (
            <div
              key={item.label}
              className="border-b border-r border-[var(--color-border)] p-4 last:border-r-0 sm:[&:nth-child(5n)]:border-r-0"
            >
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                {item.label}
              </p>
              <p className={`mt-2 text-xl ${valueClass(item.status)}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
