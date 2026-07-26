"use client";

import { StockAutocomplete } from "@/components/search/StockAutocomplete";

type HeroSearchProps = {
  compact?: boolean;
};

export function HeroSearch({ compact = false }: HeroSearchProps) {
  return (
    <section className={compact ? "" : "bg-white"}>
      <div className={compact ? "" : "container-page py-16 md:py-24"}>
        {!compact && (
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">Mapa do Ativo</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-[var(--color-text)] md:text-6xl">Do ativo ao patrimônio.</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">Analise ações e FIIs, compare indicadores, simule cenários e organize sua carteira em uma experiência simples, rápida e objetiva.</p>
          </div>
        )}

        <div className={compact ? "mx-auto max-w-2xl" : "mx-auto mt-10 max-w-2xl"}>
          <StockAutocomplete
            placeholder="Digite o ticker, nome da empresa ou FII"
            showButton
            buttonLabel="Pesquisar ativo"
            popularTickers={compact ? [] : ["PETR4", "VALE3", "ITUB4", "BBSE3", "WEGE3"]}
          />
        </div>
      </div>
    </section>
  );
}
