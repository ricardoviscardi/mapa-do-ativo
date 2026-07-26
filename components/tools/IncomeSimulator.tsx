"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatPlainPercent } from "@/lib/utils/formatters";

function parseInput(value: string) {
  const numberValue = Number(value.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function barWidth(value: number, max: number) {
  if (max <= 0) return "0%";
  return `${Math.max(3, Math.min(100, (value / max) * 100))}%`;
}

export function IncomeSimulator() {
  const [initialAmount, setInitialAmount] = useState("10000");
  const [monthlyContribution, setMonthlyContribution] = useState("500");
  const [annualYield, setAnnualYield] = useState("8,00");
  const [years, setYears] = useState("10");
  const [reinvest, setReinvest] = useState(true);

  const result = useMemo(() => {
    const initial = parseInput(initialAmount);
    const contribution = parseInput(monthlyContribution);
    const annualYieldValue = parseInput(annualYield) / 100;
    const months = Math.max(1, Math.round(parseInput(years) * 12));
    const monthlyRate = annualYieldValue / 12;
    let patrimony = initial;
    let accumulatedIncome = 0;
    const yearly: { year: number; patrimony: number; monthlyIncome: number; accumulatedIncome: number }[] = [];

    for (let month = 1; month <= months; month += 1) {
      patrimony += contribution;
      const income = patrimony * monthlyRate;
      accumulatedIncome += income;
      if (reinvest) patrimony += income;
      if (month % 12 === 0 || month === months) {
        yearly.push({
          year: Math.ceil(month / 12),
          patrimony,
          monthlyIncome: patrimony * monthlyRate,
          accumulatedIncome,
        });
      }
    }

    return {
      patrimony,
      accumulatedIncome,
      monthlyIncome: patrimony * monthlyRate,
      totalContributions: initial + contribution * months,
      yearly: yearly.slice(-8),
    };
  }, [annualYield, initialAmount, monthlyContribution, reinvest, years]);

  const maxYearlyPatrimony = Math.max(...result.yearly.map((item) => item.patrimony), 1);

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card>
        <h2 className="text-2xl font-bold">Monte uma simulação</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Ajuste aporte, prazo e rendimento estimado para visualizar a evolução possível dos proventos.</p>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
            Valor inicial
            <input value={initialAmount} onChange={(event) => setInitialAmount(event.target.value)} inputMode="decimal" className="min-h-12 rounded-2xl border border-[var(--color-border)] px-4 text-sm font-semibold normal-case tracking-normal outline-none focus:border-[var(--color-primary)]" />
          </label>
          <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
            Aporte mensal
            <input value={monthlyContribution} onChange={(event) => setMonthlyContribution(event.target.value)} inputMode="decimal" className="min-h-12 rounded-2xl border border-[var(--color-border)] px-4 text-sm font-semibold normal-case tracking-normal outline-none focus:border-[var(--color-primary)]" />
          </label>
          <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
            Rendimento anual estimado (%)
            <input value={annualYield} onChange={(event) => setAnnualYield(event.target.value)} inputMode="decimal" className="min-h-12 rounded-2xl border border-[var(--color-border)] px-4 text-sm font-semibold normal-case tracking-normal outline-none focus:border-[var(--color-primary)]" />
          </label>
          <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
            Prazo em anos
            <input value={years} onChange={(event) => setYears(event.target.value)} inputMode="decimal" className="min-h-12 rounded-2xl border border-[var(--color-border)] px-4 text-sm font-semibold normal-case tracking-normal outline-none focus:border-[var(--color-primary)]" />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] p-4 text-sm font-semibold">
            <input type="checkbox" checked={reinvest} onChange={(event) => setReinvest(event.target.checked)} />
            Reinvestir proventos na simulação
          </label>
        </div>
      </Card>

      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-white to-blue-50/50">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">Patrimônio estimado</p>
            <p className="mt-3 text-3xl font-black">{formatCurrency(result.patrimony)}</p>
          </Card>
          <Card>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">Proventos mensais</p>
            <p className="mt-3 text-3xl font-black">{formatCurrency(result.monthlyIncome)}</p>
          </Card>
          <Card>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">Proventos acumulados</p>
            <p className="mt-3 text-3xl font-black">{formatCurrency(result.accumulatedIncome)}</p>
          </Card>
        </div>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Evolução projetada</h2>
              <p className="mt-2 text-sm text-[var(--color-muted)]">Gráfico simples por ano, baseado nas premissas acima.</p>
            </div>
            <p className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-[var(--color-primary)]">Yield: {formatPlainPercent(parseInput(annualYield))} ao ano</p>
          </div>
          <div className="mt-6 grid gap-3">
            {result.yearly.map((item) => (
              <div key={item.year} className="grid gap-2 sm:grid-cols-[80px_1fr_150px] sm:items-center">
                <span className="text-sm font-bold text-[var(--color-primary)]">Ano {item.year}</span>
                <div className="h-3 overflow-hidden rounded-full bg-[var(--color-background-alt)]">
                  <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: barWidth(item.patrimony, maxYearlyPatrimony) }} />
                </div>
                <span className="text-sm font-semibold text-[var(--color-text)]">{formatCurrency(item.patrimony)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-bold">Leitura rápida</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            A simulação considera rendimento constante e não inclui impostos, taxas, oscilações de preço, inflação ou mudanças nos pagamentos. Use como estudo de cenário, não como previsão.
          </p>
        </Card>
      </div>
    </div>
  );
}
