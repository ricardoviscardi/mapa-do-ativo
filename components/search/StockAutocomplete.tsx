"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type StockSuggestion = {
  symbol: string;
  name: string;
  sector?: string;
  logoUrl?: string;
  type?: string;
  source?: string;
};

type StockAutocompleteProps = {
  placeholder?: string;
  showButton?: boolean;
  buttonLabel?: string;
  compact?: boolean;
  popularTickers?: string[];
};

function cleanTicker(value: string): string {
  return value.trim().replace(/\s+/g, "").toLowerCase();
}

const STOCK_UNIT_TICKERS = new Set([
  "BPAC11",
  "ENGI11",
  "KLBN11",
  "SANB11",
  "SAPR11",
  "TAEE11",
]);

function isFiiSuggestion(item?: StockSuggestion | null): boolean {
  if (!item) return false;
  const symbol = item.symbol.toUpperCase();
  const type = String(item.type ?? "").toLowerCase();
  const sector = String(item.sector ?? "").toLowerCase();
  return (
    type === "fii" ||
    type === "fund" ||
    sector.includes("fii") ||
    sector.includes("fundo") ||
    (symbol.endsWith("11") && !STOCK_UNIT_TICKERS.has(symbol))
  );
}

function targetPathForSuggestion(item: StockSuggestion): string {
  const normalizedTicker = cleanTicker(completeCommonB3Ticker(item.symbol));
  return isFiiSuggestion(item) ? `/fiis/${normalizedTicker}` : `/acoes/${normalizedTicker}`;
}

function targetPathForRawTicker(ticker: string): string {
  const normalized = completeCommonB3Ticker(ticker);
  const lower = cleanTicker(normalized);
  const shouldOpenAsFii = normalized.endsWith("11") && !STOCK_UNIT_TICKERS.has(normalized);
  return shouldOpenAsFii ? `/fiis/${lower}` : `/acoes/${lower}`;
}

function completeCommonB3Ticker(value: string): string {
  const normalized = value.trim().replace(/\s+/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (/^[A-Z]{4}$/.test(normalized)) {
    return `${normalized}3`;
  }
  return normalized;
}

export function StockAutocomplete({
  placeholder = "Pesquisar ticker",
  showButton = false,
  buttonLabel = "Pesquisar ativo",
  compact = false,
  popularTickers = []
}: StockAutocompleteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (normalizedQuery.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/search/stocks?q=${encodeURIComponent(normalizedQuery)}`, {
          signal: controller.signal
        });
        const data = await response.json() as { results?: StockSuggestion[] };
        setSuggestions(data.results ?? []);
        setActiveIndex(0);
        setIsOpen(true);
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [normalizedQuery]);

  function goToTicker(ticker: string, suggestion?: StockSuggestion | null) {
    const normalizedTicker = cleanTicker(completeCommonB3Ticker(ticker));
    if (!normalizedTicker) return;

    router.push(suggestion ? targetPathForSuggestion(suggestion) : targetPathForRawTicker(ticker));
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (suggestions.length && isOpen) {
      goToTicker(suggestions[activeIndex]?.symbol ?? suggestions[0].symbol, suggestions[activeIndex] ?? suggestions[0]);
      return;
    }

    goToTicker(query);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!suggestions.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => (current + 1) % suggestions.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
    }

    if (event.key === "Enter" && isOpen) {
      event.preventDefault();
      goToTicker(suggestions[activeIndex]?.symbol ?? suggestions[0].symbol, suggestions[activeIndex] ?? suggestions[0]);
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  function handleBlur() {
    closeTimer.current = setTimeout(() => setIsOpen(false), 150);
  }

  function handleFocus() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
    }

    if (suggestions.length) {
      setIsOpen(true);
    }
  }

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className={compact ? "" : "w-full"}>
        <div className={showButton ? "flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-2 shadow-sm md:flex-row" : ""}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={placeholder}
            className={showButton
              ? "focus-ring min-h-12 flex-1 rounded-xl px-4 text-base text-[var(--color-text)] placeholder:text-[var(--color-muted)]"
              : "focus-ring h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background-alt)] px-3 text-sm"
            }
            aria-label="Pesquisar ativo"
            autoComplete="off"
          />
          {showButton ? <Button type="submit">{buttonLabel}</Button> : null}
        </div>
      </form>

      {isOpen && normalizedQuery.length >= 2 ? (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-xl">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-[var(--color-muted)]">Buscando ativos...</div>
          ) : suggestions.length ? (
            <div className="max-h-80 overflow-y-auto py-2">
              {suggestions.map((item, index) => (
                <button
                  key={`${item.symbol}-${index}`}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => goToTicker(item.symbol, item)}
                  className={index === activeIndex
                    ? "flex w-full items-center gap-3 bg-[var(--color-background-alt)] px-4 py-3 text-left"
                    : "flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[var(--color-background-alt)]"
                  }
                >
                  {item.logoUrl ? (
                    <img src={item.logoUrl} alt="" className="h-8 w-8 rounded-lg border border-[var(--color-border)] object-contain" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-xs font-bold text-[var(--color-primary)]">
                      {item.symbol.slice(0, 2)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-[var(--color-text)]">{item.symbol}</span>
                    <span className="block truncate text-xs text-[var(--color-muted)]">
                      {item.name}{item.sector ? ` • ${item.sector}` : ""}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-[var(--color-muted)]">
              Nenhum ativo encontrado. Você ainda pode digitar o ticker completo.
            </div>
          )}
        </div>
      ) : null}

      {popularTickers.length ? (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {popularTickers.map((ticker) => (
            <button
              key={ticker}
              type="button"
              onClick={() => goToTicker(ticker)}
              className="focus-ring rounded-full border border-[var(--color-border)] bg-[var(--color-background-alt)] px-4 py-2 text-sm font-semibold text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              {ticker}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
