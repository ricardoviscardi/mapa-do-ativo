import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { RankingTableData } from "@/lib/rankings/ranking-engine";

type FeaturedRankingPreviewProps = {
  title?: string;
  tables: RankingTableData[];
  linkBaseByKind?: Partial<Record<RankingTableData["kind"], string>>;
};

export function FeaturedRankingPreview({
  title = "Dados em destaque",
  tables,
  linkBaseByKind = { stock: "/acoes", fii: "/fiis" },
}: FeaturedRankingPreviewProps) {
  if (!tables.length) return null;

  return (
    <div className="mt-6 grid gap-5">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text)]">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
          Recortes vivos dos rankings do Mapa do Ativo. Os destaques usam filtros conservadores e não substituem análise própria.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {tables.map((table) => {
          const base = linkBaseByKind[table.kind] ?? "/acoes";
          const visibleItems = table.items.filter((item) => !item.isOutlier).slice(0, 5);
          return (
            <Card key={table.slug}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">{table.valueLabel}</p>
                  <h3 className="mt-1 text-xl font-bold">{table.title}</h3>
                </div>
                <Link href={`/rankings/${table.slug}`} className="shrink-0 rounded-full border border-[var(--color-border)] px-3 py-2 text-xs font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]">
                  Ranking completo
                </Link>
              </div>

              <div className="mt-4 grid gap-2">
                {visibleItems.map((item, index) => (
                  <Link
                    key={`${table.slug}-${item.ticker}`}
                    href={`${base}/${item.ticker.toLowerCase()}`}
                    className="grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-alt)] p-3 text-sm transition hover:border-[var(--color-primary)] hover:bg-white"
                  >
                    <span className="font-bold text-[var(--color-primary)]">{index + 1}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-[var(--color-text)]">{item.ticker}</span>
                      <span className="block truncate text-xs text-[var(--color-muted)]">{item.name}</span>
                    </span>
                    <span className="font-bold text-[var(--color-text)]">{item.displayValue}</span>
                  </Link>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
