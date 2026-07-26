"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { AssetDirectoryItem } from "@/lib/directories/asset-directory-data";

type ComparatorClientProps = {
  stocks: AssetDirectoryItem[];
  fiis: AssetDirectoryItem[];
};

type CompareItem = AssetDirectoryItem & { kind: "stock" | "fii" };

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}


const popularComparisons = [
  { label: "PETR4 x VALE3", tickers: ["PETR4", "VALE3"] },
  { label: "ITUB4 x BBDC4", tickers: ["ITUB4", "BBDC4"] },
  { label: "BBAS3 x ITUB4", tickers: ["BBAS3", "ITUB4"] },
  { label: "MXRF11 x KNCR11", tickers: ["MXRF11", "KNCR11"] },
  { label: "XPML11 x VISC11", tickers: ["XPML11", "VISC11"] },
  { label: "HGLG11 x BTLG11", tickers: ["HGLG11", "BTLG11"] },
];

function metricRows(items: CompareItem[]) {
  return [
    { label: "Preço", value: (item: CompareItem) => item.priceDisplay },
    { label: "Dividend Yield", value: (item: CompareItem) => item.dividendYieldDisplay },
    { label: "P/L", value: (item: CompareItem) => item.kind === "stock" ? item.peDisplay : "Não aplicável" },
    { label: "P/VP", value: (item: CompareItem) => item.pvpDisplay },
    { label: "Setor/segmento", value: (item: CompareItem) => item.sector },
    { label: "Valor de mercado / volume", value: (item: CompareItem) => item.marketCapDisplay },
    { label: "Histórico", value: (item: CompareItem) => item.hasHistory ? "Disponível" : "Recente" },
  ].filter(() => items.length > 0);
}

export function ComparatorClient({ stocks, fiis }: ComparatorClientProps) {
  const allItems = useMemo<CompareItem[]>(() => [
    ...stocks.map((item) => ({ ...item, kind: "stock" as const })),
    ...fiis.map((item) => ({ ...item, kind: "fii" as const })),
  ], [stocks, fiis]);

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(["PETR4", "VALE3", "XPML11"]);

  const selectedItems = selected
    .map((ticker) => allItems.find((item) => item.ticker === ticker))
    .filter(Boolean) as CompareItem[];

  const suggestions = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return allItems.slice(0, 10);
    return allItems
      .filter((item) => normalize(`${item.ticker} ${item.name} ${item.sector}`).includes(q))
      .slice(0, 10);
  }, [allItems, query]);

  function toggleTicker(ticker: string) {
    setSelected((current) => {
      if (current.includes(ticker)) return current.filter((item) => item !== ticker);
      return [...current, ticker];
    });
  }

  function removeTicker(ticker: string) {
    setSelected((current) => current.filter((item) => item !== ticker));
  }

  return (
    <div className="grid gap-6">
      <Card>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
            Buscar ativo para comparar
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ticker, nome, setor ou segmento"
              className="min-h-12 rounded-2xl border border-[var(--color-border)] bg-white px-4 text-sm font-medium normal-case tracking-normal text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
            />
          </label>
          <p className="text-sm font-semibold text-[var(--color-muted)]">Selecione quantos ativos quiser</p>
        </div>

        {selectedItems.length ? (
          <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">Ativos selecionados</p>
              <button
                type="button"
                onClick={() => setSelected([])}
                className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-bold text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                Limpar seleção
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedItems.map((item) => (
                <span key={`selected-${item.ticker}`} className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-[var(--color-primary)]">
                  {item.ticker}
                  <button
                    type="button"
                    aria-label={`Remover ${item.ticker} da comparação`}
                    onClick={() => removeTicker(item.ticker)}
                    className="grid h-5 w-5 place-items-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {suggestions.map((item) => {
            const active = selected.includes(item.ticker);
            return (
              <button
                key={`${item.kind}-${item.ticker}`}
                type="button"
                onClick={() => toggleTicker(item.ticker)}
                className={`rounded-2xl border p-3 text-left transition ${active ? "border-[var(--color-primary)] bg-blue-50" : "border-[var(--color-border)] bg-[var(--color-background-alt)] hover:border-[var(--color-primary)]"}`}
              >
                <span className="block font-bold text-[var(--color-primary)]">{item.ticker}</span>
                <span className="mt-1 block truncate text-xs text-[var(--color-muted)]">{item.name}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-white to-blue-50/40">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold">Comparações populares</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Use atalhos para montar combinações comuns e abrir a análise lado a lado.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularComparisons.map((comparison) => (
              <button
                key={comparison.label}
                type="button"
                onClick={() => setSelected(comparison.tickers)}
                className="rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)] hover:bg-blue-50"
              >
                {comparison.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Comparação lado a lado</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              Compare indicadores principais, setor e histórico antes de abrir a página completa do ativo.
            </p>
          </div>
          <Link href="/metodologia/como-ler-os-rankings" className="rounded-full border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]">
            Como ler os rankings
          </Link>
        </div>

        {selectedItems.length ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted)]">
                  <th className="py-3 pr-4 font-semibold">Métrica</th>
                  {selectedItems.map((item) => (
                    <th key={item.ticker} className="px-4 py-3 font-semibold">
                      <div className="flex max-w-[200px] items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`/${item.kind === "stock" ? "acoes" : "fiis"}/${item.ticker.toLowerCase()}`} className="text-[var(--color-primary)] hover:underline">
                            {item.ticker}
                          </Link>
                          <span className="block max-w-[180px] truncate text-xs font-medium text-[var(--color-muted)]">{item.name}</span>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remover ${item.ticker} da comparação`}
                          onClick={() => removeTicker(item.ticker)}
                          className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-900"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metricRows(selectedItems).map((row) => (
                  <tr key={row.label} className="border-b border-[var(--color-border)] last:border-b-0">
                    <td className="py-4 pr-4 font-bold text-[var(--color-text)]">{row.label}</td>
                    {selectedItems.map((item) => (
                      <td key={`${row.label}-${item.ticker}`} className="px-4 py-4 font-semibold text-[var(--color-text)]">
                        {row.value(item)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background-alt)] p-6 text-sm text-[var(--color-muted)]">
            Escolha pelo menos um ativo para iniciar a comparação.
          </div>
        )}
      </Card>
    </div>
  );
}
