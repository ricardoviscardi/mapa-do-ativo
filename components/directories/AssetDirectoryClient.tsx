"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { AssetDirectoryItem, DirectoryKind, DirectoryQualityStatus } from "@/lib/directories/asset-directory-data";

type SortKey =
  | "ticker"
  | "name"
  | "quality"
  | "price"
  | "dy"
  | "pe"
  | "pvp"
  | "marketCap"
  | "volume";

type AssetDirectoryClientProps = {
  kind: DirectoryKind;
  items: AssetDirectoryItem[];
};

const displayOptions: Array<{ value: "todos" | DirectoryQualityStatus; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "OK", label: "Lista principal" },
  { value: "parcial", label: "Lista ampliada" },
  { value: "limitado", label: "Consulta ampla" },
  { value: "inconsistente", label: "Atualizações recentes" },
];

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}


function sortValue(item: AssetDirectoryItem, key: SortKey): string | number {
  if (key === "ticker") return item.ticker;
  if (key === "name") return item.name;
  if (key === "quality") return item.qualityScore;
  if (key === "price") return item.price ?? -Infinity;
  if (key === "dy") return item.dividendYield ?? -Infinity;
  if (key === "pe") return item.pe ?? Infinity;
  if (key === "pvp") return item.pvp ?? Infinity;
  if (key === "marketCap") return item.marketCap ?? -Infinity;
  if (key === "volume") return item.volume ?? -Infinity;
  return item.ticker;
}

function compareItems(a: AssetDirectoryItem, b: AssetDirectoryItem, sort: SortKey): number {
  const av = sortValue(a, sort);
  const bv = sortValue(b, sort);

  if (typeof av === "string" || typeof bv === "string") {
    return String(av).localeCompare(String(bv), "pt-BR");
  }

  if (sort === "pe" || sort === "pvp") return av - bv;
  return bv - av;
}

export function AssetDirectoryClient({ kind, items }: AssetDirectoryClientProps) {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("todos");
  const [displayFilter, setDisplayFilter] = useState<"todos" | DirectoryQualityStatus>("todos");
  const [sort, setSort] = useState<SortKey>(kind === "stock" ? "marketCap" : "dy");
  const [onlyWithHistory, setOnlyWithHistory] = useState(false);
  const [visibleCount, setVisibleCount] = useState(30);

  const plural = kind === "stock" ? "ações" : "FIIs";
  const hrefBase = kind === "stock" ? "/acoes" : "/fiis";
  const sectorLabel = kind === "stock" ? "Setor" : "Segmento";
  const dataUpdateHref = "/metodologia/dados-em-atualizacao";

  const sectors = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.sector).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [items]);

  const summary = useMemo(() => {
    return {
      total: items.length,
      withHistory: items.filter((item) => item.hasHistory).length,
      sectors: new Set(items.map((item) => item.sector).filter(Boolean)).size,
      withDividends: items.filter((item) => item.hasDividends).length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeSearch(query.trim());
    return [...items]
      .filter((item) => {
        const haystack = normalizeSearch(`${item.ticker} ${item.name} ${item.sector}`);
        const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
        const matchesSector = sector === "todos" || item.sector === sector;
        const matchesDisplay = displayFilter === "todos" || item.qualityStatus === displayFilter;
        const matchesHistory = !onlyWithHistory || item.hasHistory;
        return matchesQuery && matchesSector && matchesDisplay && matchesHistory;
      })
      .sort((a, b) => compareItems(a, b, sort));
  }, [items, query, sector, displayFilter, sort, onlyWithHistory]);

  useEffect(() => {
    setVisibleCount(30);
  }, [query, sector, displayFilter, sort, onlyWithHistory, kind]);

  const visibleItems = filtered.slice(0, visibleCount);
  const hasMoreItems = visibleItems.length < filtered.length;

  const quickLinks = kind === "stock"
    ? [
        { href: "/rankings/maiores-dividend-yield", label: "Maior DY" },
        { href: "/rankings/menores-pl", label: "Menor P/L" },
        { href: "/rankings/menores-pvp", label: "Menor P/VP" },
        { href: "/rankings/maiores-valor-de-mercado", label: "Maior valor de mercado" },
        { href: "/acoes/setores", label: "Como comparar setores" },
      ]
    : [
        { href: "/rankings/fiis-maior-dividend-yield", label: "Maior DY" },
        { href: "/rankings/fiis-menor-pvp", label: "Menor P/VP" },
        { href: "/rankings/fiis-maior-patrimonio", label: "Maior patrimônio" },
        { href: "/fiis/segmentos", label: "Como comparar segmentos" },
        { href: "/fiis/rendimentos", label: "Entender rendimentos" },
      ];

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-white to-blue-50/40">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">{kind === "stock" ? "Ações brasileiras" : "Fundos imobiliários"}</p>
          <p className="mt-2 text-3xl font-bold">{summary.total}</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Ativos disponíveis no diretório.</p>
        </Card>
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">{kind === "stock" ? "Indicadores essenciais" : "Rendimentos"}</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">Organizados</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Métricas em formato simples para comparar.</p>
        </Card>
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">{kind === "stock" ? "Comparação por setor" : "Comparação por segmento"}</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">{summary.sectors}</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Agrupamentos para comparar ativos parecidos.</p>
        </Card>
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">{kind === "stock" ? "Rankings atualizados" : "Rankings de FIIs"}</p>
          <p className="mt-2 text-3xl font-bold">{summary.withHistory}</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Séries disponíveis para análise visual.</p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <h2 className="text-2xl font-bold">Diretório filtrável de {plural}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
              Busque por ticker, filtre por {sectorLabel.toLowerCase()} e ordene pelos principais indicadores. Compare ativos do mesmo universo antes de abrir a página completa.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-[var(--color-border)] px-3 py-2 text-xs font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)] hover:bg-blue-50"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-alt)] p-4">
          <h3 className="font-bold">Como usar este diretório</h3>
          <div className="mt-3 grid gap-2 text-sm leading-6 text-[var(--color-muted)] md:grid-cols-3">
            <p>Pesquise por ticker, nome ou {sectorLabel.toLowerCase()}.</p>
            <p>Compare ativos do mesmo {sectorLabel.toLowerCase()} para evitar conclusões fora de contexto.</p>
            <p>Use indicadores, histórico e dividendos como ponto de partida para sua análise.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-alt)] p-3 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto] lg:items-end">
          <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
            Buscar
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Ticker, nome ou ${sectorLabel.toLowerCase()}`}
              className="min-h-11 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
            />
          </label>

          <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
            {sectorLabel}
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
              value={displayFilter}
              onChange={(event) => setDisplayFilter(event.target.value as "todos" | DirectoryQualityStatus)}
              className="min-h-11 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
            >
              {displayOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
            Ordenar
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="min-h-11 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
            >
              <option value="ticker">Ticker</option>
              <option value="name">Nome</option>
              
              <option value="price">Preço</option>
              <option value="dy">Dividend Yield</option>
              {kind === "stock" ? <option value="pe">P/L</option> : null}
              <option value="pvp">P/VP</option>
              <option value="marketCap">Valor de mercado</option>
              <option value="volume">Volume</option>
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
          <span>{filtered.length} de {items.length} {plural} exibidos</span>
          <span>Mostrando uma seleção inicial para manter a navegação leve.</span>
        </div>

        {items.some((item) => item.volume === null) ? (
          <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs leading-5 text-[var(--color-muted)]">
            Alguns ativos podem aparecer com volume em atualização quando a fonte não retorna volume confiável no momento. {" "}
            <Link href={dataUpdateHref} className="font-bold text-[var(--color-primary)] hover:underline">
              Entenda como interpretar.
            </Link>
          </div>
        ) : null}

        {filtered.length ? (
          <>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="text-[var(--color-muted)]">
                <tr className="border-b border-[var(--color-border)]">
                  <th className="py-3 pr-4 font-semibold">Ticker</th>
                  <th className="px-4 py-3 font-semibold">Nome</th>
                  <th className="px-4 py-3 font-semibold">{sectorLabel}</th>
                  <th className="px-4 py-3 text-right font-semibold">Preço</th>
                  <th className="px-4 py-3 text-right font-semibold">DY</th>
                  <th className="px-4 py-3 text-right font-semibold">{kind === "stock" ? "P/L" : "P/VP"}</th>
                  <th className="px-4 py-3 text-right font-semibold">Valor/volume</th>
                  <th className="px-4 py-3 text-right font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => (
                  <tr key={item.ticker} className="border-b border-[var(--color-border)] align-top last:border-b-0">
                    <td className="py-4 pr-4 font-bold">
                      <Link href={`${hrefBase}/${item.ticker.toLowerCase()}`} className="text-[var(--color-primary)] hover:underline">
                        {item.ticker}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold">{item.name}</p>
                    </td>
                    <td className="px-4 py-4 text-[var(--color-muted)]">{item.sector}</td>
                    <td className="px-4 py-4 text-right font-semibold">{item.priceDisplay}</td>
                    <td className="px-4 py-4 text-right font-semibold">{item.dividendYieldDisplay}</td>
                    <td className="px-4 py-4 text-right font-semibold">{kind === "stock" ? item.peDisplay : item.pvpDisplay}</td>
                    <td className="px-4 py-4 text-right">
                      <p className="font-semibold">{item.marketCapDisplay}</p>
                      {item.volume !== null ? (
                        <p className="mt-1 text-xs text-[var(--color-muted)]">Vol. {item.volumeDisplay}</p>
                      ) : (
                        <Link
                          href={dataUpdateHref}
                          className="mt-1 block text-xs font-semibold text-[var(--color-muted)] underline-offset-4 hover:text-[var(--color-primary)] hover:underline"
                        >
                          Volume em atualização
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`${hrefBase}/${item.ticker.toLowerCase()}`}
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
            Nenhum ativo encontrado com os filtros atuais. Ajuste busca, {sectorLabel.toLowerCase()} ou filtros.
          </div>
        )}
      </Card>
    </div>
  );
}
