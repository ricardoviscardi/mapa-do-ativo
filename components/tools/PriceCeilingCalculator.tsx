"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { AssetDirectoryItem } from "@/lib/directories/asset-directory-data";
import { formatCurrency, formatPlainPercent } from "@/lib/utils/formatters";

type PriceCeilingCalculatorProps = {
  assets: AssetDirectoryItem[];
};

type Method = "bazin" | "gordon";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function decimalInput(value: string) {
  const numberValue = Number(value.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function roundInput(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function PriceCeilingCalculator({ assets }: PriceCeilingCalculatorProps) {
  const [query, setQuery] = useState("PETR4");
  const [method, setMethod] = useState<Method>("bazin");
  const [annualDividend, setAnnualDividend] = useState("1,36");
  const [requiredYield, setRequiredYield] = useState("6,00");
  const [growth, setGrowth] = useState("2,00");

  const selectedAsset = useMemo(() => {
    const normalizedQuery = normalize(query.trim());
    return assets.find((asset) => normalize(asset.ticker) === normalizedQuery) ?? null;
  }, [assets, query]);

  const suggestions = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return assets.slice(0, 8);
    return assets
      .filter((asset) => normalize(`${asset.ticker} ${asset.name} ${asset.sector}`).includes(q))
      .slice(0, 8);
  }, [assets, query]);

  const annualDividendValue = decimalInput(annualDividend);
  const requiredYieldValue = decimalInput(requiredYield) / 100;
  const growthValue = decimalInput(growth) / 100;
  const nextDividend = annualDividendValue * (1 + Math.max(growthValue, 0));

  const bazinPrice = requiredYieldValue > 0 ? annualDividendValue / requiredYieldValue : null;
  const gordonPrice = requiredYieldValue > growthValue && requiredYieldValue > 0 ? nextDividend / (requiredYieldValue - growthValue) : null;
  const selectedPrice = selectedAsset?.price ?? null;
  const activePrice = method === "bazin" ? bazinPrice : gordonPrice;
  const difference = selectedPrice && activePrice ? ((activePrice / selectedPrice) - 1) * 100 : null;

  function useAssetPremises(asset: AssetDirectoryItem) {
    setQuery(asset.ticker);
    const dy = asset.dividendYield ?? 0;
    const price = asset.price ?? 0;
    const dividend = price > 0 && dy > 0 ? price * (dy / 100) : 0;
    if (dividend > 0) setAnnualDividend(roundInput(dividend));
    if (dy > 0 && dy < 100) setRequiredYield(roundInput(Math.max(dy, 6)));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card>
        <div className="grid gap-5">
          <div>
            <h2 className="text-2xl font-bold">Simule um preço de referência</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              Ajuste dividendos, retorno desejado e crescimento esperado. O resultado é uma simulação educacional baseada nas premissas informadas.
            </p>
          </div>

          <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
            Ativo de referência, opcional
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value.toUpperCase())}
              placeholder="PETR4, VALE3, MXRF11..."
              className="min-h-12 rounded-2xl border border-[var(--color-border)] bg-white px-4 text-sm font-medium normal-case tracking-normal text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {suggestions.map((asset) => (
              <button
                key={asset.ticker}
                type="button"
                onClick={() => useAssetPremises(asset)}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-alt)] p-3 text-left transition hover:border-[var(--color-primary)]"
              >
                <span className="block font-bold text-[var(--color-primary)]">{asset.ticker}</span>
                <span className="mt-1 block truncate text-xs text-[var(--color-muted)]">{asset.name}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
              Dividendos anuais por ação/cota
              <input
                value={annualDividend}
                onChange={(event) => setAnnualDividend(event.target.value)}
                inputMode="decimal"
                className="min-h-12 rounded-2xl border border-[var(--color-border)] px-4 text-sm font-semibold normal-case tracking-normal outline-none focus:border-[var(--color-primary)]"
              />
            </label>

            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
              Retorno anual desejado (%)
              <input
                value={requiredYield}
                onChange={(event) => setRequiredYield(event.target.value)}
                inputMode="decimal"
                className="min-h-12 rounded-2xl border border-[var(--color-border)] px-4 text-sm font-semibold normal-case tracking-normal outline-none focus:border-[var(--color-primary)]"
              />
            </label>

            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
              Crescimento anual estimado (%)
              <input
                value={growth}
                onChange={(event) => setGrowth(event.target.value)}
                inputMode="decimal"
                className="min-h-12 rounded-2xl border border-[var(--color-border)] px-4 text-sm font-semibold normal-case tracking-normal outline-none focus:border-[var(--color-primary)]"
              />
            </label>

            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
              Modelo
              <select
                value={method}
                onChange={(event) => setMethod(event.target.value as Method)}
                className="min-h-12 rounded-2xl border border-[var(--color-border)] bg-white px-4 text-sm font-semibold normal-case tracking-normal outline-none focus:border-[var(--color-primary)]"
              >
                <option value="bazin">Bazin, foco em dividendos atuais</option>
                <option value="gordon">Gordon, com crescimento estimado</option>
              </select>
            </label>
          </div>
        </div>
      </Card>

      <div className="grid gap-4">
        <Card className="bg-gradient-to-br from-white to-blue-50/50">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">Resultado da simulação</p>
          <p className="mt-3 text-4xl font-black tracking-tight text-[var(--color-text)]">{formatCurrency(activePrice)}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Preço de referência pelo modelo {method === "bazin" ? "Bazin" : "Gordon"}, usando apenas as premissas informadas.
          </p>
          {selectedAsset ? (
            <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-white p-4 text-sm">
              <p className="font-bold text-[var(--color-primary)]">{selectedAsset.ticker} · {selectedAsset.priceDisplay}</p>
              <p className="mt-1 text-[var(--color-muted)]">Diferença pela simulação: {difference === null ? "Não disponível" : formatPlainPercent(difference)}</p>
            </div>
          ) : null}
        </Card>

        <Card>
          <h3 className="font-bold">Como interpretar</h3>
          <div className="mt-3 grid gap-3 text-sm leading-6 text-[var(--color-muted)]">
            <p>Bazin usa dividendos anuais divididos pelo retorno desejado.</p>
            <p>Gordon considera crescimento esperado, mas fica sensível quando a taxa desejada fica próxima do crescimento.</p>
            <p>Use o resultado como referência educacional, não como decisão automática.</p>
          </div>
          <Link href="/glossario/dividend-yield" className="mt-4 inline-flex rounded-full border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]">
            Entender Dividend Yield
          </Link>
        </Card>
      </div>
    </div>
  );
}
