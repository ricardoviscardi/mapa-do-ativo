import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { displayAssetCategory } from "@/lib/stocks/asset-display";
import { formatCurrency, formatLargeCurrency } from "@/lib/utils/formatters";
import type { StockData, StockIndicator } from "@/types/stock";

type DataQualityCardProps = {
  stock: StockData;
};

const unavailableValues = new Set(["", "—", "-", "Não disponível", "NaN"]);

function cleanValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "Não disponível";
  const text = String(value).trim();
  return unavailableValues.has(text) ? "Não disponível" : text;
}

function findIndicator(indicators: StockIndicator[], labels: string[]) {
  const normalizedLabels = labels.map((label) => label.toLowerCase());
  const indicator = indicators.find((item) => {
    const current = item.label.toLowerCase();
    return normalizedLabels.some((label) => current === label || current.includes(label));
  });

  return cleanValue(indicator?.value);
}

export function DataQualityCard({ stock }: DataQualityCardProps) {
  const isFii = stock.assetKind === "fii";
  const price = formatCurrency(stock.quote.price);
  const marketCap = formatLargeCurrency(stock.quote.marketCap);
  const dy12m = cleanValue(stock.dividendSummary.yield12m);
  const pe = findIndicator(stock.indicators, ["p/l"]);
  const pvp = findIndicator(stock.indicators, ["p/vp", "p/vp cota"]);
  const vpaOrVpCota = findIndicator(stock.indicators, isFii ? ["vp/cota", "valor da cota"] : ["vpa"]);
  const roe = findIndicator(stock.indicators, ["roe"]);

  const rows = (isFii
    ? [
        { label: "Cotação", value: price },
        { label: "DY 12m", value: dy12m },
        { label: "P/VP", value: pvp },
        { label: "VP/Cota", value: vpaOrVpCota },
        { label: "Segmento", value: cleanValue(displayAssetCategory(stock)) },
        { label: "Patrimônio", value: marketCap },
      ]
    : [
        { label: "Cotação", value: price },
        { label: "DY 12m", value: dy12m },
        { label: "P/L", value: pe },
        { label: "P/VP", value: pvp },
        { label: "ROE", value: roe },
        { label: "Valor de mercado", value: marketCap },
      ]).filter((row) => row.value !== "Não disponível");

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">Resumo rápido</p>
          <h2 className="mt-2 text-xl font-bold text-[var(--color-text)]">Leitura do ativo</h2>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[var(--color-primary)] ring-1 ring-blue-100">
          Consulta
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
        Veja os principais números do ativo em uma leitura rápida antes de comparar com empresas ou fundos parecidos.
      </p>

      <div className="mt-4 grid gap-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] py-2 text-sm last:border-b-0">
            <span className="text-[var(--color-muted)]">{row.label}</span>
            <span className="max-w-[170px] truncate text-right font-bold text-[var(--color-text)]">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        <Link
          href="/comparador"
          className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[var(--color-border)] px-4 text-xs font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)] hover:bg-blue-50"
        >
          Comparar ativo
        </Link>
        <Link
          href={isFii ? "/ferramentas/raio-x-carteira" : "/ferramentas/preco-teto"}
          className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[var(--color-border)] px-4 text-xs font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)] hover:bg-blue-50"
        >
          {isFii ? "Usar no Raio-X" : "Simular preço-teto"}
        </Link>
      </div>
    </Card>
  );
}
