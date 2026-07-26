import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { popularFIIs, stockSuggestionsFallback } from "@/lib/stocks/stock-list";

function nameForTicker(ticker: string): string {
  return stockSuggestionsFallback.find((item) => item.symbol === ticker)?.name ?? ticker;
}

export function PopularFIIs() {
  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            FIIs em destaque
          </p>
          <h2 className="mt-2 text-2xl font-bold">Fundos imobiliários mais buscados</h2>
        </div>
        <Link href="/fiis" className="text-sm font-semibold text-[var(--color-primary)]">
          Ver diretório
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {popularFIIs.slice(0, 5).map((ticker) => (
          <Link key={ticker} href={`/fiis/${ticker.toLowerCase()}`}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]">
              <p className="font-bold text-[var(--color-primary)]">{ticker}</p>
              <p className="mt-1 truncate text-xs font-semibold text-[var(--color-text)]">{nameForTicker(ticker)}</p>
              <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">
                Cotação, rendimentos, P/VP, patrimônio e histórico em uma página simples.
              </p>
              <span className="mt-4 inline-flex rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
                Ver fundo
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
