"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { AssetDirectoryItem } from "@/lib/directories/asset-directory-data";
import { formatCurrency, formatPlainPercent } from "@/lib/utils/formatters";

type PortfolioXRayClientProps = {
  stocks: AssetDirectoryItem[];
  fiis: AssetDirectoryItem[];
};

type PortfolioAsset = AssetDirectoryItem & { kind: "stock" | "fii" };

type Position = {
  ticker: string;
  weight: number;
};

const initialPositions: Position[] = [
  { ticker: "PETR4", weight: 20 },
  { ticker: "VALE3", weight: 15 },
  { ticker: "ITUB4", weight: 15 },
  { ticker: "MXRF11", weight: 20 },
  { ticker: "XPML11", weight: 15 },
  { ticker: "KNCR11", weight: 15 },
];

function normalize(value: string) {
  return value.trim().toUpperCase();
}

function pct(value: number) {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}%`;
}

function barStyle(value: number) {
  return { width: `${Math.max(2, Math.min(100, value))}%` };
}

export function PortfolioXRayClient({ stocks, fiis }: PortfolioXRayClientProps) {
  const allAssets = useMemo<PortfolioAsset[]>(() => [
    ...stocks.map((item) => ({ ...item, kind: "stock" as const })),
    ...fiis.map((item) => ({ ...item, kind: "fii" as const })),
  ], [fiis, stocks]);

  const [amount, setAmount] = useState("50000");
  const [positions, setPositions] = useState<Position[]>(initialPositions);

  const enriched = positions
    .map((position) => {
      const asset = allAssets.find((item) => item.ticker === normalize(position.ticker));
      return asset ? { ...position, asset, normalizedWeight: Number.isFinite(position.weight) ? Math.max(0, position.weight) : 0 } : null;
    })
    .filter(Boolean) as { ticker: string; weight: number; normalizedWeight: number; asset: PortfolioAsset }[];

  const totalWeight = enriched.reduce((sum, item) => sum + item.normalizedWeight, 0) || 1;
  const normalized = enriched.map((item) => ({ ...item, share: item.normalizedWeight / totalWeight * 100 }));
  const totalAmount = Number(amount.replace(/\./g, "").replace(",", ".")) || 0;
  const stockAllocation = normalized.filter((item) => item.asset.kind === "stock").reduce((sum, item) => sum + item.share, 0);
  const fiiAllocation = normalized.filter((item) => item.asset.kind === "fii").reduce((sum, item) => sum + item.share, 0);
  const weightedYield = normalized.reduce((sum, item) => sum + ((item.asset.dividendYield ?? 0) * item.share / 100), 0);
  const estimatedAnnualIncome = totalAmount * weightedYield / 100;
  const concentration = Math.max(...normalized.map((item) => item.share), 0);

  const sectors = normalized.reduce<Record<string, number>>((acc, item) => {
    const key = item.asset.sector || "Outros";
    acc[key] = (acc[key] ?? 0) + item.share;
    return acc;
  }, {});
  const topSectors = Object.entries(sectors).sort((a, b) => b[1] - a[1]).slice(0, 6);

  function updatePosition(index: number, patch: Partial<Position>) {
    setPositions((current) => current.map((position, itemIndex) => itemIndex === index ? { ...position, ...patch } : position));
  }

  function addPosition() {
    setPositions((current) => [...current, { ticker: "", weight: 0 }].slice(0, 12));
  }

  function removePosition(index: number) {
    setPositions((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[430px_1fr]">
      <Card>
        <h2 className="text-2xl font-bold">Informe sua carteira</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Digite ticker e peso aproximado. A leitura é educacional e não exige dados pessoais.</p>

        <label className="mt-5 grid gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
          Valor aproximado da carteira, opcional
          <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" className="min-h-12 rounded-2xl border border-[var(--color-border)] px-4 text-sm font-semibold normal-case tracking-normal outline-none focus:border-[var(--color-primary)]" />
        </label>

        <div className="mt-5 grid gap-3">
          {positions.map((position, index) => (
            <div key={index} className="grid grid-cols-[1fr_96px_auto] gap-2">
              <input
                value={position.ticker}
                onChange={(event) => updatePosition(index, { ticker: event.target.value.toUpperCase() })}
                placeholder="Ticker"
                className="min-h-11 rounded-2xl border border-[var(--color-border)] px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
              />
              <input
                value={position.weight}
                onChange={(event) => updatePosition(index, { weight: Number(event.target.value) })}
                type="number"
                min="0"
                className="min-h-11 rounded-2xl border border-[var(--color-border)] px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
              />
              <button type="button" onClick={() => removePosition(index)} className="rounded-2xl border border-[var(--color-border)] px-3 text-xs font-bold text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
                Remover
              </button>
            </div>
          ))}
        </div>

        <button type="button" onClick={addPosition} className="mt-4 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]">
          Adicionar ativo
        </button>
      </Card>

      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-white to-blue-50/50">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">Ações</p>
            <p className="mt-3 text-3xl font-black">{pct(stockAllocation)}</p>
          </Card>
          <Card>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">FIIs</p>
            <p className="mt-3 text-3xl font-black">{pct(fiiAllocation)}</p>
          </Card>
          <Card>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">DY médio</p>
            <p className="mt-3 text-3xl font-black">{formatPlainPercent(weightedYield)}</p>
          </Card>
          <Card>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">Proventos/ano</p>
            <p className="mt-3 text-3xl font-black">{formatCurrency(estimatedAnnualIncome)}</p>
          </Card>
        </div>

        <Card>
          <h2 className="text-2xl font-bold">Distribuição visual</h2>
          <div className="mt-5 grid gap-4">
            <div>
              <div className="mb-2 flex justify-between text-sm font-bold"><span>Ações</span><span>{pct(stockAllocation)}</span></div>
              <div className="h-4 overflow-hidden rounded-full bg-[var(--color-background-alt)]"><div className="h-full rounded-full bg-[var(--color-primary)]" style={barStyle(stockAllocation)} /></div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm font-bold"><span>FIIs</span><span>{pct(fiiAllocation)}</span></div>
              <div className="h-4 overflow-hidden rounded-full bg-[var(--color-background-alt)]"><div className="h-full rounded-full bg-[var(--color-positive)]" style={barStyle(fiiAllocation)} /></div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h3 className="text-xl font-bold">Setores e segmentos</h3>
            <div className="mt-4 grid gap-3">
              {topSectors.map(([sector, share]) => (
                <div key={sector}>
                  <div className="mb-1 flex justify-between gap-3 text-sm font-semibold"><span className="truncate">{sector}</span><span>{pct(share)}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--color-background-alt)]"><div className="h-full rounded-full bg-[var(--color-primary)]" style={barStyle(share)} /></div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-bold">Leitura rápida</h3>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-[var(--color-muted)]">
              <p>{concentration >= 30 ? "Um ativo concentra uma parte relevante da carteira. Vale comparar pesos e objetivo de cada posição." : "A concentração por ativo está distribuída nas premissas informadas."}</p>
              <p>{stockAllocation > 70 ? "A carteira está mais exposta a ações." : fiiAllocation > 70 ? "A carteira está mais exposta a FIIs." : "A carteira combina ações e FIIs de forma equilibrada nas premissas informadas."}</p>
              <p>Use o comparador para avaliar ativos parecidos antes de alterar pesos.</p>
            </div>
            <Link href="/comparador" className="mt-4 inline-flex rounded-full border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]">
              Abrir comparador
            </Link>
          </Card>
        </div>

        <Card>
          <h3 className="text-xl font-bold">Ativos informados</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-[var(--color-border)] text-left text-[var(--color-muted)]">
                <tr><th className="py-3 pr-4">Ativo</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Peso</th><th className="px-4 py-3">DY</th><th className="px-4 py-3">Setor/segmento</th><th className="px-4 py-3">Página</th></tr>
              </thead>
              <tbody>
                {normalized.map((item) => (
                  <tr key={`${item.asset.kind}-${item.asset.ticker}`} className="border-b border-[var(--color-border)] last:border-b-0">
                    <td className="py-3 pr-4 font-bold text-[var(--color-primary)]">{item.asset.ticker}</td>
                    <td className="px-4 py-3">{item.asset.kind === "stock" ? "Ação" : "FII"}</td>
                    <td className="px-4 py-3 font-semibold">{pct(item.share)}</td>
                    <td className="px-4 py-3">{item.asset.dividendYieldDisplay}</td>
                    <td className="px-4 py-3">{item.asset.sector}</td>
                    <td className="px-4 py-3"><Link className="font-bold text-[var(--color-primary)] hover:underline" href={`/${item.asset.kind === "stock" ? "acoes" : "fiis"}/${item.asset.ticker.toLowerCase()}`}>Ver ativo</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
