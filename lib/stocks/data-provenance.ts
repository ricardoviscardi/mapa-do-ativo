import { existsSync } from "node:fs";
import path from "node:path";
import type { StockData } from "@/types/stock";

export type DataOrigin =
  | "supabase"
  | "snapshot_local"
  | "snapshot_remoto"
  | "complemento_publico"
  | "mock"
  | "indisponivel";

export type PublicDataOrigin = {
  code: DataOrigin;
  label: string;
  description: string;
  confidence: "alta" | "media" | "limitada";
};

export function normalizeTickerForData(ticker: string): string {
  return ticker.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function localSnapshotPath(ticker: string): string {
  return path.join(
    process.cwd(),
    "public",
    "data",
    "snapshots",
    "stocks",
    `${normalizeTickerForData(ticker)}.json`,
  );
}

export function hasLocalSnapshot(ticker: string): boolean {
  return existsSync(localSnapshotPath(ticker));
}

export function detectDataOrigin(stock: StockData): DataOrigin {
  const source = stock.source.toLowerCase();

  if (source.includes("snapshot local")) return "snapshot_local";
  if (source.includes("snapshot remoto")) return "snapshot_remoto";
  if (source.includes("complemento público") || source.includes("complemento publico")) return "complemento_publico";
  if (source.includes("mock")) return "mock";
  if (source.includes("base mapa do ativo") || source.includes("supabase")) return "supabase";
  if (stock.quote.price === null && stock.history.length === 0) return "indisponivel";

  return "supabase";
}

export function publicDataOrigin(stock: StockData): PublicDataOrigin {
  const code = detectDataOrigin(stock);

  if (code === "supabase") {
    return {
      code,
      label: "Banco principal",
      description: "Dados consolidados diretamente da base principal do Mapa do Ativo.",
      confidence: "alta",
    };
  }

  if (code === "snapshot_local") {
    return {
      code,
      label: "Snapshot local",
      description: "Cópia consolidada publicada pelos workflows e lida do projeto local.",
      confidence: "alta",
    };
  }

  if (code === "snapshot_remoto") {
    return {
      code,
      label: "Snapshot remoto",
      description: "Cópia consolidada do repositório usada quando a rede local bloqueia o banco.",
      confidence: "media",
    };
  }

  if (code === "complemento_publico") {
    return {
      code,
      label: "Complemento público",
      description: "Dados complementares usados para preencher lacunas quando a base principal não cobre o ativo.",
      confidence: "media",
    };
  }

  if (code === "mock") {
    return {
      code,
      label: "Exemplo interno",
      description: "Registro usado apenas como fallback técnico. Não deve ser destacado em rankings.",
      confidence: "limitada",
    };
  }

  return {
    code,
    label: "Indisponível",
    description: "Não há dados suficientes consolidados para o ativo neste momento.",
    confidence: "limitada",
  };
}
