"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import type { StockHistoryPoint } from "@/types/stock";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatDate, formatPlainPercent } from "@/lib/utils/formatters";

type PriceChartCardProps = {
  ticker: string;
  history: StockHistoryPoint[];
};

type RangeKey = "1D" | "5D" | "1M" | "6M" | "1A" | "5A" | "10A" | "YTD";

type ChartPoint = StockHistoryPoint & {
  x: number;
  y: number;
  variationFromStart: number | null;
};

const ranges: RangeKey[] = ["1D", "5D", "1M", "6M", "1A", "5A", "10A", "YTD"];
const MAX_CUSTOM_YEARS = 10;

function daysForRange(range: RangeKey): number | null {
  if (range === "1D") return 1;
  if (range === "5D") return 5;
  if (range === "1M") return 31;
  if (range === "6M") return 183;
  if (range === "1A") return 365;
  if (range === "5A") return 365 * 5;
  if (range === "10A") return 365 * 10;
  return null;
}

function median(values: number[]): number | null {
  const ordered = values
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);

  if (!ordered.length) return null;

  const middle = Math.floor(ordered.length / 2);

  if (ordered.length % 2 === 0) {
    return (ordered[middle - 1] + ordered[middle]) / 2;
  }

  return ordered[middle];
}

function isIsolatedPriceOutlier(
  previous: StockHistoryPoint,
  current: StockHistoryPoint,
  next: StockHistoryPoint,
): boolean {
  const previousClose = previous.close;
  const currentClose = current.close;
  const nextClose = next.close;

  if (previousClose <= 0 || currentClose <= 0 || nextClose <= 0) return false;

  const neighborRatio = Math.max(previousClose, nextClose) / Math.min(previousClose, nextClose);

  // Se os vizinhos também mudaram muito, pode ser evento real de preço, grupamento/desdobramento
  // ou ajuste de série. Só removemos quando o ponto do meio é uma queda/pico isolado.
  if (neighborRatio > 1.5) return false;

  const currentVsPrevious = currentClose / previousClose;
  const currentVsNext = currentClose / nextClose;

  return (
    (currentVsPrevious >= 4 && currentVsNext >= 4) ||
    (currentVsPrevious <= 0.25 && currentVsNext <= 0.25)
  );
}

function isLocalPriceOutlier(
  history: StockHistoryPoint[],
  index: number,
): boolean {
  const current = history[index];

  if (!current || !Number.isFinite(current.close) || current.close <= 0) return true;

  const start = Math.max(0, index - 4);
  const end = Math.min(history.length, index + 5);
  const localValues = history
    .slice(start, end)
    .filter((_, localIndex) => start + localIndex !== index)
    .map((point) => point.close)
    .filter((value) => Number.isFinite(value) && value > 0);

  if (localValues.length < 4) return false;

  const localMedian = median(localValues);

  if (!localMedian || localMedian <= 0) return false;

  const ratio = current.close / localMedian;
  const stableNeighbors = localValues.filter((value) => {
    const neighborRatio = value / localMedian;
    return neighborRatio >= 0.65 && neighborRatio <= 1.55;
  }).length;

  // Remove artefatos como cotações zeradas/centavos isoladas ou spikes importados da fonte,
  // sem apagar quedas/tendências reais quando a vizinhança inteira acompanha o movimento.
  return stableNeighbors >= 3 && (ratio <= 0.45 || ratio >= 2.25);
}

function removeOutlierPass(history: StockHistoryPoint[]): StockHistoryPoint[] {
  if (history.length < 3) return history;

  return history.filter((point, index) => {
    const previous = history[index - 1];
    const next = history[index + 1];

    if (!previous || !next) return true;

    return !isIsolatedPriceOutlier(previous, point, next) && !isLocalPriceOutlier(history, index);
  });
}

function sortedHistory(history: StockHistoryPoint[]): StockHistoryPoint[] {
  const sorted = [...history]
    .filter((point) => (
      point.date &&
      Number.isFinite(point.close) &&
      point.close > 0 &&
      Number.isFinite(new Date(point.date).getTime())
    ))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sorted.length < 3) return sorted;

  // Duas passagens removem também pares pequenos de pontos ruins consecutivos.
  return removeOutlierPass(removeOutlierPass(sorted));
}

function filterHistory(history: StockHistoryPoint[], range: RangeKey): StockHistoryPoint[] {
  const sorted = sortedHistory(history);

  if (!sorted.length) return [];

  if (range === "YTD") {
    const lastYear = new Date(sorted[sorted.length - 1].date).getFullYear();
    const ytd = sorted.filter((point) => new Date(point.date).getFullYear() === lastYear);
    return ytd.length >= 2 ? ytd : sorted.slice(-Math.min(sorted.length, 60));
  }

  const days = daysForRange(range);

  if (!days) return sorted;

  const lastDate = new Date(sorted[sorted.length - 1].date);
  const minDate = new Date(lastDate);
  minDate.setDate(minDate.getDate() - days);

  const filtered = sorted.filter((point) => new Date(point.date) >= minDate);

  if (filtered.length >= 2) return filtered;
  if (range === "1D") return sorted.slice(-2);
  if (range === "5D") return sorted.slice(-5);
  if (range === "1M") return sorted.slice(-22);
  if (range === "6M") return sorted.slice(-126);

  return sorted;
}

function inputDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function parseInputDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isFinite(date.getTime()) ? date : null;
}

function yearsBefore(date: Date, years: number): Date {
  const copy = new Date(date);
  copy.setFullYear(copy.getFullYear() - years);
  return copy;
}

function filterCustomHistory(history: StockHistoryPoint[], startValue: string, endValue: string) {
  const sorted = sortedHistory(history);

  if (!sorted.length) {
    return { points: [], limited: false };
  }

  const firstAvailable = new Date(sorted[0].date);
  const lastAvailable = new Date(sorted[sorted.length - 1].date);
  let start = parseInputDate(startValue) ?? firstAvailable;
  let end = parseInputDate(endValue) ?? lastAvailable;

  if (start > end) {
    const temp = start;
    start = end;
    end = temp;
  }

  let limited = false;
  const minAllowedStart = yearsBefore(end, MAX_CUSTOM_YEARS);

  if (start < minAllowedStart) {
    start = minAllowedStart;
    limited = true;
  }

  const points = sorted.filter((point) => {
    const date = new Date(point.date);
    return date >= start && date <= end;
  });

  return {
    points,
    limited
  };
}

function variationFromStart(current: number, start: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(start) || start === 0) return null;
  return ((current / start) - 1) * 100;
}

function signedPercent(value: number | null): string {
  if (value === null) return "Não disponível";
  const formatted = formatPlainPercent(value);
  return value > 0 ? `+${formatted}` : formatted;
}

function roundedClose(value: number): number {
  return Math.round(value * 100) / 100;
}

function longestRepeatedCloseRun(points: StockHistoryPoint[]): number {
  let longest = 0;
  let current = 0;
  let previous: number | null = null;

  for (const point of points) {
    const close = roundedClose(point.close);

    if (previous !== null && close === previous) {
      current += 1;
    } else {
      current = 1;
      previous = close;
    }

    longest = Math.max(longest, current);
  }

  return longest;
}

function getChartQualityWarning(points: StockHistoryPoint[]): string | null {
  if (points.length < 2) return null;

  const roundedValues = points.map((point) => roundedClose(point.close));
  const distinctValues = new Set(roundedValues).size;
  const longestRun = longestRepeatedCloseRun(points);
  const longestRunRatio = longestRun / points.length;

  // FIIs e ações ilíquidas podem voltar da fonte com o mesmo fechamento repetido por muitos dias.
  // Nesses casos, mostrar uma linha reta longa passa uma precisão que a base ainda não tem.
  if (points.length >= 30 && longestRunRatio >= 0.48) {
    return "Histórico com baixa variação no período selecionado. O gráfico é resumido para preservar uma leitura visual mais clara.";
  }

  if (points.length >= 60 && distinctValues <= 3) {
    return "Histórico com poucos preços distintos no período selecionado. O gráfico é resumido para preservar uma leitura visual mais clara.";
  }

  return null;
}

export function PriceChartCard({ ticker, history }: PriceChartCardProps) {
  const [activeRange, setActiveRange] = useState<RangeKey>("1A");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const svgRef = useRef<SVGSVGElement | null>(null);

  const orderedHistory = useMemo(() => sortedHistory(history), [history]);
  const minAvailable = inputDate(orderedHistory[0]?.date);
  const maxAvailable = inputDate(orderedHistory[orderedHistory.length - 1]?.date);
  const hasCustomRange = Boolean(customStart || customEnd);

  const filteredResult = useMemo(() => {
    if (hasCustomRange) {
      return filterCustomHistory(history, customStart, customEnd);
    }

    return {
      points: filterHistory(history, activeRange),
      limited: false
    };
  }, [activeRange, customEnd, customStart, hasCustomRange, history]);

  const points = filteredResult.points;
  const chartQualityWarning = getChartQualityWarning(points);
  const hasChart = points.length >= 2 && !chartQualityWarning;
  const width = 900;
  const height = 360;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 24;
  const paddingBottom = 38;

  const values = points.map((point) => point.close);
  const min = hasChart ? Math.min(...values) : 0;
  const max = hasChart ? Math.max(...values) : 1;
  const range = max - min || 1;
  const first = points[0]?.close ?? 0;
  const last = points[points.length - 1]?.close ?? 0;
  const isPositive = last >= first;
  const lineColor = isPositive ? "var(--color-positive)" : "var(--color-negative)";
  const solidColor = isPositive ? "#10B981" : "#EF4444";

  const chartPoints: ChartPoint[] = points.map((point, index) => {
    const x = paddingLeft + (index / Math.max(points.length - 1, 1)) * (width - paddingLeft - paddingRight);
    const y = paddingTop + ((max - point.close) / range) * (height - paddingTop - paddingBottom);

    return {
      ...point,
      x,
      y,
      variationFromStart: variationFromStart(point.close, first)
    };
  });

  const polyline = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints = `${paddingLeft},${height - paddingBottom} ${polyline} ${width - paddingRight},${height - paddingBottom}`;
  const hoveredPoint = hoveredIndex === null ? null : chartPoints[hoveredIndex] ?? null;

  function handleMouseMove(event: MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || !chartPoints.length) return;

    const rect = svg.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * width;

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    chartPoints.forEach((point, index) => {
      const distance = Math.abs(point.x - relativeX);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setHoveredIndex(nearestIndex);
  }

  function clearCustomRange() {
    setCustomStart("");
    setCustomEnd("");
    setHoveredIndex(null);
  }

  return (
    <Card>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Cotação
          </p>
          <h2 className="mt-2 text-2xl font-bold">Gráfico de {ticker}</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {ranges.map((rangeLabel) => (
            <button
              key={rangeLabel}
              type="button"
              onClick={() => {
                setActiveRange(rangeLabel);
                clearCustomRange();
              }}
              className={
                !hasCustomRange && activeRange === rangeLabel
                  ? "rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-bold text-white"
                  : "rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              }
            >
              {rangeLabel}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-alt)] p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
          Data inicial
          <input
            type="date"
            value={customStart}
            min={minAvailable}
            max={customEnd || maxAvailable}
            onChange={(event) => {
              setCustomStart(event.target.value);
              setHoveredIndex(null);
            }}
            className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)]"
          />
        </label>

        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
          Data final
          <input
            type="date"
            value={customEnd}
            min={customStart || minAvailable}
            max={maxAvailable}
            onChange={(event) => {
              setCustomEnd(event.target.value);
              setHoveredIndex(null);
            }}
            className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)]"
          />
        </label>

        <button
          type="button"
          onClick={clearCustomRange}
          className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]"
        >
          Limpar datas
        </button>
      </div>

      {filteredResult.limited ? (
        <p className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
          O intervalo personalizado foi limitado a no máximo 10 anos.
        </p>
      ) : null}

      {hasChart ? (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={`Gráfico de cotação de ${ticker}`}
            className="h-[380px] w-full cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id={`area-${ticker}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={solidColor} stopOpacity="0.18" />
                <stop offset="100%" stopColor={solidColor} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {[0, 1, 2, 3, 4].map((line) => {
              const y = paddingTop + (line / 4) * (height - paddingTop - paddingBottom);
              const value = max - (line / 4) * range;

              return (
                <g key={line}>
                  <line
                    x1={paddingLeft}
                    x2={width - paddingRight}
                    y1={y}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeDasharray="4 8"
                  />
                  <text x="0" y={y + 4} fontSize="12" fill="#6B7280">
                    {formatCurrency(value)}
                  </text>
                </g>
              );
            })}

            <polygon points={areaPoints} fill={`url(#area-${ticker})`} />

            <polyline
              points={polyline}
              fill="none"
              stroke={lineColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {chartPoints.map((point, index) => {
              if (index !== 0 && index !== chartPoints.length - 1) return null;

              return (
                <circle
                  key={`${point.date}-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill={solidColor}
                />
              );
            })}

            {hoveredPoint ? (
              <g>
                <line
                  x1={hoveredPoint.x}
                  x2={hoveredPoint.x}
                  y1={paddingTop}
                  y2={height - paddingBottom}
                  stroke="#1E3A8A"
                  strokeDasharray="4 6"
                  strokeOpacity="0.6"
                />
                <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="6" fill={solidColor} stroke="white" strokeWidth="3" />

                <g transform={`translate(${Math.min(Math.max(hoveredPoint.x - 92, paddingLeft), width - 206)}, ${Math.max(hoveredPoint.y - 88, 8)})`}>
                  <rect width="184" height="72" rx="14" fill="white" stroke="#E5E7EB" filter="drop-shadow(0 10px 24px rgba(15, 23, 42, 0.16))" />
                  <text x="14" y="22" fontSize="12" fontWeight="700" fill="#1F2937">
                    {formatDate(hoveredPoint.date)}
                  </text>
                  <text x="14" y="44" fontSize="14" fontWeight="800" fill="#1F2937">
                    {formatCurrency(hoveredPoint.close)}
                  </text>
                  <text x="14" y="62" fontSize="12" fontWeight="700" fill={hoveredPoint.variationFromStart !== null && hoveredPoint.variationFromStart < 0 ? "#EF4444" : "#10B981"}>
                    {signedPercent(hoveredPoint.variationFromStart)} no período
                  </text>
                </g>
              </g>
            ) : null}
          </svg>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-muted)]">
            <span>{formatDate(points[0]?.date)}</span>
            <span className={isPositive ? "font-bold text-[var(--color-positive)]" : "font-bold text-[var(--color-negative)]"}>
              {formatCurrency(last)}
            </span>
            <span>{formatDate(points[points.length - 1]?.date)}</span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background-alt)] p-8 text-sm leading-6 text-[var(--color-muted)]">
          {chartQualityWarning ?? "Histórico de cotação não disponível na resposta das fontes atuais. O gráfico será exibido automaticamente quando houver pontos de preço."}
        </div>
      )}

      <p className="mt-3 text-xs text-[var(--color-muted)]">
        Gráfico montado com histórico de fechamento. Pontos claramente inconsistentes ou séries com repetição excessiva são desconsiderados para preservar uma leitura visual mais estável. {" "}
        <Link href="/metodologia/dados-em-atualizacao" className="font-bold text-[var(--color-primary)] underline-offset-4 hover:underline">
          Entenda os filtros.
        </Link>
      </p>
    </Card>
  );
}
