"use client";

import { useMemo, useState } from "react";
import type { DividendEvent } from "@/types/stock";
import { Card } from "@/components/ui/Card";

type DividendsTableProps = {
  dividends: DividendEvent[];
};

const PAGE_SIZE = 12;

function displayDate(value: string) {
  return value && value !== "Não disponível" ? value : "—";
}

function hasDisplayableDate(value: string) {
  return displayDate(value) !== "—";
}

export function DividendsTable({ dividends }: DividendsTableProps) {
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(dividends.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);

  const visibleDividends = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return dividends.slice(start, start + PAGE_SIZE);
  }, [dividends, safePage]);

  const hasPreviousPage = safePage > 0;
  const hasNextPage = safePage < pageCount - 1;
  const showComDate = dividends.some((dividend) => hasDisplayableDate(dividend.comDate));

  return (
    <Card>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h2 className="text-xl font-bold">Dividendos e proventos</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Histórico consolidado de proventos dos últimos 5 anos, exibido em blocos de 12 lançamentos.
          </p>
        </div>

        {dividends.length > PAGE_SIZE ? (
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 0))}
              disabled={!hasPreviousPage}
              aria-label="Ver proventos mais recentes"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] font-bold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[var(--color-primary)]"
            >
              ‹
            </button>
            <span className="min-w-16 text-center text-xs font-semibold text-[var(--color-muted)]">
              {safePage + 1} de {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(current + 1, pageCount - 1))}
              disabled={!hasNextPage}
              aria-label="Ver proventos mais antigos"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] font-bold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[var(--color-primary)]"
            >
              ›
            </button>
          </div>
        ) : null}
      </div>

      {visibleDividends.length ? (
        <div className="mt-6 overflow-x-auto">
          <table className={`w-full ${showComDate ? "min-w-[620px]" : "min-w-[520px]"} border-collapse text-left text-sm`}>
            <thead className="text-[var(--color-muted)]">
              <tr className="border-b border-[var(--color-border)]">
                <th className="py-3 pr-4 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Valor</th>
                {showComDate ? <th className="px-4 py-3 font-semibold">Data com</th> : null}
                <th className="px-4 py-3 font-semibold">Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {visibleDividends.map((dividend, index) => (
                <tr key={`${dividend.type}-${dividend.paymentDate}-${safePage}-${index}`} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="py-3 pr-4 font-medium">{dividend.type}</td>
                  <td className="px-4 py-3 font-bold text-[var(--color-positive)]">{dividend.value}</td>
                  {showComDate ? (
                    <td className="px-4 py-3 text-[var(--color-muted)]">{displayDate(dividend.comDate)}</td>
                  ) : null}
                  <td className="px-4 py-3 text-[var(--color-muted)]">{displayDate(dividend.paymentDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background-alt)] p-6 text-sm leading-6 text-[var(--color-muted)]">
          Ainda não há histórico de proventos consolidado para este ativo na base do Mapa do Ativo. Assim que os pagamentos forem processados, eles serão exibidos nesta seção.
        </div>
      )}
    </Card>
  );
}
