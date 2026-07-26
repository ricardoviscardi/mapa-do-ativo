"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { RankingGroup, RankingItem, RankingTableData } from "@/lib/rankings/ranking-engine";

export type { RankingGroup, RankingItem, RankingTableData };

type RankingSelectorProps = {
  stocks: RankingGroup;
  fiis: RankingGroup;
};

type Mode = "stocks" | "fiis";

type RankingTableExplorerProps = {
  table: RankingTableData;
  linkBase: string;
  compact?: boolean;
};


function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function RankingSelector({ stocks, fiis }: RankingSelectorProps) {
  const [mode, setMode] = useState<Mode>("stocks");
  const active = mode === "stocks" ? stocks : fiis;
  const linkBase = mode === "stocks" ? "/acoes" : "/fiis";

  return (
    <div className="grid gap-6">
      <Card className="bg-gradient-to-br from-white to-blue-50/40">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
              Tipo de ativo
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              Escolha o universo do ranking
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
              Os rankings organizam ativos por indicador, setor, liquidez e histórico. A ideia é facilitar a comparação sem poluição visual.
            </p>
          </div>

          <div className="inline-flex rounded-2xl border border-[var(--color-border)] bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setMode("stocks")}
              className={
                mode === "stocks"
                  ? "rounded-xl bg-[var(--color-primary)] px-5 py-2 text-sm font-bold text-white"
                  : "rounded-xl px-5 py-2 text-sm font-semibold text-[var(--color-muted)] transition hover:text-[var(--color-primary)]"
              }
            >
              Ações
            </button>
            <button
              type="button"
              onClick={() => setMode("fiis")}
              className={
                mode === "fiis"
                  ? "rounded-xl bg-[var(--color-primary)] px-5 py-2 text-sm font-bold text-white"
                  : "rounded-xl px-5 py-2 text-sm font-semibold text-[var(--color-muted)] transition hover:text-[var(--color-primary)]"
              }
            >
              FIIs
            </button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-background-alt)] p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h2 className="text-xl font-bold">{active.label}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            {active.description}
          </p>
        </div>
        <Link
          href={mode === "stocks" ? "/acoes" : "/fiis"}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-white px-4 text-sm font-bold text-[var(--color-primary)] shadow-sm transition hover:border-[var(--color-primary)]"
        >
          Ver lista de {mode === "stocks" ? "ações" : "FIIs"}
        </Link>
      </div>

      {active.tables.map((table) => (
        <RankingTableExplorer
          key={`${mode}-${table.title}`}
          table={table}
          linkBase={linkBase}
          compact
        />
      ))}
    </div>
  );
}

export function RankingTableExplorer({ table, linkBase, compact = false }: RankingTableExplorerProps) {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("todos");
  const [minQuality, setMinQuality] = useState("0");
  const [onlyWithHistory, setOnlyWithHistory] = useState(false);
  const [visibleCount, setVisibleCount] = useState(compact ? 10 : 30);

  const sectors = useMemo(() => {
    return Array.from(new Set(table.items.map((item) => item.sector).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [table.items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalizeSearch(query.trim());
    const minScore = Number(minQuality);

    return table.items.filter((item) => {
      const matchesQuery = !normalizedQuery || normalizeSearch(`${item.ticker} ${item.name} ${item.sector}`).includes(normalizedQuery);
      const matchesSector = sector === "todos" || item.sector === sector;
      const matchesQuality = item.qualityScore >= minScore;
      const matchesHistory = !onlyWithHistory || item.hasHistory;
      return matchesQuery && matchesSector && matchesQuality && matchesHistory;
    });
  }, [table.items, query, sector, minQuality, onlyWithHistory]);

  useEffect(() => {
    setVisibleCount(compact ? 10 : 30);
  }, [query, sector, minQuality, onlyWithHistory, compact, table.slug]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMoreItems = !compact && visibleItems.length < filteredItems.length;

  return (
    <Card>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold">{table.title}</h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
              {table.valueLabel}
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
            {table.description}
          </p>
        </div>
        <Link
          href={`/rankings/${table.slug}`}
          className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[var(--color-border)] px-4 text-sm font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]"
        >
          Página completa
        </Link>
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-alt)] p-3 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-end">
        <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
          Buscar
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ticker, nome ou setor"
            className="min-h-11 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
          />
        </label>

        <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
          Setor/segmento
          <select
            value={sector}
            onChange={(event) => setSector(event.target.value)}
            className="min-h-11 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
          >
            <option value="todos">Todos</option>
            {sectors.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
          Exibir
          <select
            value={minQuality}
            onChange={(event) => setMinQuality(event.target.value)}
            className="min-h-11 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
          >
            <option value="0">Exibir todos</option>
            <option value="50">Lista ampliada</option>
            <option value="70">Lista principal</option>
            <option value="85">Mais consistentes</option>
          </select>
        </label>

        <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-semibold text-[var(--color-text)]">
          <input
            type="checkbox"
            checked={onlyWithHistory}
            onChange={(event) => setOnlyWithHistory(event.target.checked)}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          Histórico consistente
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[var(--color-muted)]">
        <span>{filteredItems.length} de {table.items.length} ativos exibidos</span>
        <span>Ordenação por {table.valueLabel.toLowerCase()}</span>
      </div>

      {filteredItems.length ? (
        <>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead className="text-[var(--color-muted)]">
              <tr className="border-b border-[var(--color-border)]">
                <th className="py-3 pr-4 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Ticker</th>
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Setor/segmento</th>
                <th className="px-4 py-3 text-right font-semibold">{table.valueLabel}</th>
                <th className="px-4 py-3 text-right font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item, index) => (
                <tr
                  key={`${table.title}-${item.ticker}-${index}`}
                  className="border-b border-[var(--color-border)] align-top last:border-b-0"
                >
                  <td className="py-4 pr-4 font-bold text-[var(--color-primary)]">
                    {index + 1}
                  </td>
                  <td className="px-4 py-4 font-bold">
                    <Link
                      href={`${linkBase}/${item.ticker.toLowerCase()}`}
                      className="text-[var(--color-primary)] hover:underline"
                    >
                      {item.ticker}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold">{item.name}</p>
                    {item.issues.length ? (
                      <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--color-muted)]">
                        
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-[var(--color-muted)]">
                    {item.sector}
                  </td>
                  <td className="px-4 py-4 text-right font-bold">
                    {item.displayValue}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`${linkBase}/${item.ticker.toLowerCase()}`}
                      className="inline-flex rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)] hover:bg-blue-50"
                    >
                      Ver ativo
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasMoreItems ? (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((current) => current + 30)}
              className="rounded-full border border-[var(--color-border)] px-5 py-2 text-sm font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)] hover:bg-blue-50"
            >
              Carregar mais
            </button>
          </div>
        ) : null}
        </>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background-alt)] p-6 text-sm text-[var(--color-muted)]">
          Nenhum ativo encontrado com os filtros atuais. Ajuste busca, setor ou filtros.
        </div>
      )}
    </Card>
  );
}
