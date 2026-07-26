"use client";

import { useMemo, useState } from "react";
import type { AnalysisTable, FundamentalAnalysisData, StockIndicator } from "@/types/stock";
import { Card } from "@/components/ui/Card";

type FundamentalAnalysisTableProps = {
  data: FundamentalAnalysisData;
  indicators?: StockIndicator[];
  assetKind?: "stock" | "fii";
};

type TabKey = "indicators" | "balanceSheet" | "incomeStatement" | "cashFlow";
type PeriodKey = "annual" | "quarterly";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "indicators", label: "Indicadores" },
  { key: "balanceSheet", label: "Balanço Patrimonial" },
  { key: "incomeStatement", label: "DRE" },
  { key: "cashFlow", label: "Fluxo de Caixa" },
];

const periods: Array<{ key: PeriodKey; label: string }> = [
  { key: "annual", label: "Anual" },
  { key: "quarterly", label: "Trimestral" },
];

function hasUsefulValue(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    normalized !== "" &&
    normalized !== "—" &&
    normalized !== "-" &&
    normalized !== "não disponível" &&
    normalized !== "nao disponivel" &&
    normalized !== "em consolidação"
  );
}

function tableHasData(table: AnalysisTable) {
  return table.rows.some((row) => row.values.some(hasUsefulValue));
}

function hasHistoricalColumns(table: AnalysisTable) {
  return table.columns.some((column) => {
    const normalized = column.trim().toLowerCase();
    return normalized !== "" && normalized !== "—" && normalized !== "-" && normalized !== "atual";
  });
}

function isOnlyCurrentTable(table: AnalysisTable) {
  return tableHasData(table) && !hasHistoricalColumns(table);
}

export function FundamentalAnalysisTable({ data, assetKind = "stock" }: FundamentalAnalysisTableProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("indicators");
  const [activePeriod, setActivePeriod] = useState<PeriodKey>("annual");

  const visibleTabs = useMemo(() => {
    return tabs.filter((tab) => {
      const group = data[tab.key];
      return tableHasData(group.annual) || tableHasData(group.quarterly);
    });
  }, [data]);

  const effectiveTab = visibleTabs.some((tab) => tab.key === activeTab)
    ? activeTab
    : (visibleTabs[0]?.key ?? "indicators");

  const visiblePeriods = useMemo(() => {
    const group = data[effectiveTab];
    return periods.filter((period) => tableHasData(group[period.key]));
  }, [data, effectiveTab]);

  const effectivePeriod = visiblePeriods.some((period) => period.key === activePeriod)
    ? activePeriod
    : (visiblePeriods[0]?.key ?? "annual");

  const table = data[effectiveTab][effectivePeriod];
  const hasRows = tableHasData(table);
  const onlyCurrent = isOnlyCurrentTable(table);
  const showDataWarnings = process.env.NEXT_PUBLIC_SHOW_DATA_WARNINGS === "true";

  return (
    <Card>
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div>
          <h2 className="text-xl font-bold">Análise fundamentalista</h2>

          {visibleTabs.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-6 border-b border-[var(--color-border)] text-sm">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={
                    effectiveTab === tab.key
                      ? "border-b-2 border-[var(--color-primary)] pb-3 font-semibold text-[var(--color-primary)]"
                      : "pb-3 text-[var(--color-muted)] transition hover:text-[var(--color-primary)]"
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {visiblePeriods.length > 1 ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--color-muted)]">Período:</span>
            {visiblePeriods.map((period) => (
              <button
                key={period.key}
                type="button"
                onClick={() => setActivePeriod(period.key)}
                className={
                  effectivePeriod === period.key
                    ? "rounded-full bg-[var(--color-primary)]/10 px-3 py-1 font-bold text-[var(--color-primary)]"
                    : "rounded-full px-3 py-1 font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-background-alt)]"
                }
              >
                {period.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {hasRows ? (
        <>
          {onlyCurrent && showDataWarnings ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              {assetKind === "fii" ? (
                <>
                  Esta tabela prioriza os dados mais recentes disponíveis para leitura do fundo.
                </>
              ) : (
                <>
                  Esta tabela prioriza os dados mais recentes disponíveis para leitura do ativo.
                </>
              )}
            </div>
          ) : null}
          <AnalysisRows table={table} activeTab={effectiveTab} />
        </>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background-alt)] p-6 text-sm text-[var(--color-muted)]">
{assetKind === "fii"
            ? "Os dados fundamentalistas deste fundo serão exibidos quando houver informação suficiente para uma tabela útil."
            : "Os demonstrativos históricos deste ativo serão exibidos quando houver informação suficiente para uma tabela útil."}
        </div>
      )}
    </Card>
  );
}

function AnalysisRows({ table, activeTab }: { table: AnalysisTable; activeTab: TabKey }) {
  const firstColumn = activeTab === "indicators" ? "Indicador" : "Conta";
  const rows = table.rows.filter((row) => row.values.some(hasUsefulValue));

  return (
    <div className="mt-6 max-w-full overflow-x-auto rounded-2xl">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm md:min-w-[820px]">
        <thead className="text-[var(--color-muted)]">
          <tr className="border-b border-[var(--color-border)]">
            <th className="py-3 pr-4 font-semibold">{firstColumn}</th>
            {table.columns.map((column, index) => (
              <th key={`${column}-${index}`} className="px-4 py-3 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-[var(--color-border)] last:border-b-0">
              <td className="max-w-[220px] break-words py-3 pr-4 font-medium text-[var(--color-muted)]">
                {row.label}
              </td>
              {row.values.map((value, index) => (
                <td key={`${row.label}-${index}`} className={index === 0 ? "px-4 py-3 font-semibold" : "px-4 py-3"}>
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
