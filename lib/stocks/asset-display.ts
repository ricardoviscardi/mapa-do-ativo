import type { StockData } from "@/types/stock";
import { sameDisplayText, sanitizeDisplayText } from "@/lib/utils/text";
import { stockSuggestionsFallback } from "@/lib/stocks/stock-list";

const GENERIC_FII_LABELS = new Set([
  "fii",
  "fundo imobiliario",
  "fundos imobiliarios",
  "fundos imobiliarios fii",
  "real estate",
  "imobiliario",
  "nao disponivel",
]);

const FII_SEGMENT_BY_TICKER: Record<string, string> = {
  MXRF11: "Recebíveis imobiliários",
  KNCR11: "Recebíveis imobiliários",
  CPTS11: "Recebíveis imobiliários",
  KNSC11: "Recebíveis imobiliários",
  RBRR11: "Recebíveis imobiliários",
  IRDM11: "Recebíveis imobiliários",
  VGIR11: "Recebíveis imobiliários",
  HGCR11: "Recebíveis imobiliários",
  RECR11: "Recebíveis imobiliários",
  KNIP11: "Recebíveis imobiliários indexados",
  KNHY11: "Recebíveis imobiliários high yield",
  BCRI11: "Recebíveis imobiliários",
  DEVA11: "Recebíveis imobiliários high yield",
  HCTR11: "Recebíveis imobiliários high yield",
  MCCI11: "Recebíveis imobiliários",
  OUJP11: "Recebíveis imobiliários",
  URPR11: "Recebíveis imobiliários",
  VRTA11: "Recebíveis imobiliários",
  HGLG11: "Logística",
  BTLG11: "Logística",
  XPLG11: "Logística",
  BRCO11: "Logística",
  VILG11: "Logística",
  RBRL11: "Logística",
  GGRC11: "Logística",
  LVBI11: "Logística",
  HSLG11: "Logística",
  XPIN11: "Galpões industriais",
  XPML11: "Shoppings",
  VISC11: "Shoppings",
  HSML11: "Shoppings",
  MALL11: "Shoppings",
  BRCR11: "Lajes corporativas",
  HGRE11: "Lajes corporativas",
  HGPO11: "Lajes corporativas",
  PVBI11: "Lajes corporativas",
  RECT11: "Lajes corporativas",
  TEPP11: "Lajes corporativas",
  VINO11: "Lajes corporativas",
  XPPR11: "Lajes corporativas",
  BCFF11: "Fundo de fundos",
  KFOF11: "Fundo de fundos",
  RBRF11: "Fundo de fundos",
  RBRP11: "Híbrido",
  JSRE11: "Híbrido",
  KNRI11: "Híbrido",
  TRXF11: "Renda urbana",
  HGRU11: "Renda urbana",
  RBVA11: "Renda urbana",
  ALZR11: "Renda urbana",
  RZTR11: "Agro",
  KNCA11: "Agro",
};

function normalizeComparable(value: string | null | undefined): string {
  return sanitizeDisplayText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function stripFiiPrefix(value: string): string {
  return value
    .replace(/^FII\s*[-–:]\s*/i, "")
    .replace(/^FI\s*[-–:]\s*/i, "")
    .replace(/\s+FII$/i, "")
    .replace(/\s+FI$/i, "")
    .trim();
}

function isGenericFiiLabel(value: string | null | undefined): boolean {
  const normalized = normalizeComparable(value);
  if (!normalized) return true;
  return GENERIC_FII_LABELS.has(normalized) || normalized === "fundos" || normalized === "fundo";
}

function segmentFromKeyword(text: string): string | null {
  const normalized = normalizeComparable(text);
  if (!normalized) return null;

  if (/(recebiveis|cri|credito|securities|rendimentos|high yield|indices de precos|ipca)/.test(normalized)) return "Recebíveis imobiliários";
  if (/(logistica|logistico|log|galpoes|industrial|brco|hslg)/.test(normalized)) return "Logística";
  if (/(shopping|malls|mall|varejo)/.test(normalized)) return "Shoppings";
  if (/(lajes|corporativas|office|offices|escritorio|escritorios|prime properties|tepp|brcr|rect|vino)/.test(normalized)) return "Lajes corporativas";
  if (/(fundo de fundos|fof|multiestrategia|alpha)/.test(normalized)) return "Fundo de fundos";
  if (/(renda urbana|urbana|hgru|rbva|alzr|trx real estate)/.test(normalized)) return "Renda urbana";
  if (/(agro|terrax|agronegocio|fazenda|rural)/.test(normalized)) return "Agro";
  if (/(hibrido|renda imobiliaria|real estate)/.test(normalized)) return "Híbrido";
  if (/(hotel|hotelaria)/.test(normalized)) return "Hotelaria";
  if (/(saude|hospital)/.test(normalized)) return "Saúde";
  if (/(educacional|educacao)/.test(normalized)) return "Educacional";

  return null;
}


const SHORT_NAME_BY_TICKER = new Map(
  stockSuggestionsFallback.map((item) => [item.symbol.toUpperCase(), item.name]),
);

function looksLikeLongLegalFundName(value: string): boolean {
  const normalized = normalizeComparable(value);
  if (!normalized) return false;

  return (
    value.length > 34 ||
    /fundo de investimento|investimento imobiliario|responsabilidade limitada|fii imobiliario/i.test(value) ||
    normalized.split(" ").length >= 6
  );
}

function stripCommonAssetSuffixes(value: string): string {
  return value
    .replace(/\s+ATZ\b/gi, "")
    .replace(/\s+NM\b/gi, "")
    .replace(/\s+N1\b/gi, "")
    .replace(/\s+N2\b/gi, "")
    .replace(/\s+ON\s+EJ\b/gi, " ON")
    .replace(/\s+PN\s+EJ\b/gi, " PN")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function displayAssetName(stock: Pick<StockData, "ticker" | "companyName" | "fullName" | "assetKind">): string {
  const ticker = stock.ticker.toUpperCase();
  const rawName = sanitizeDisplayText(stock.companyName) || sanitizeDisplayText(stock.fullName) || ticker;
  const fallbackName = SHORT_NAME_BY_TICKER.get(ticker);

  if (isFiiAsset({ ticker, assetKind: stock.assetKind }) && fallbackName && looksLikeLongLegalFundName(rawName)) {
    return fallbackName;
  }

  return stripCommonAssetSuffixes(rawName) || fallbackName || ticker;
}

export function isFiiAsset(stock: Pick<StockData, "assetKind" | "ticker">): boolean {
  return stock.assetKind === "fii" || stock.ticker.toUpperCase().endsWith("11");
}

export function displayFiiSegment(
  stock: Pick<StockData, "ticker" | "companyName" | "fullName" | "sector" | "subsector">,
): string {
  const ticker = stock.ticker.toUpperCase();
  const mapped = FII_SEGMENT_BY_TICKER[ticker];
  if (mapped) return mapped;

  const candidate = [stock.subsector, stock.sector]
    .map((value) => stripFiiPrefix(sanitizeDisplayText(value)))
    .find((value) => value && !isGenericFiiLabel(value));

  if (candidate) return candidate;

  const inferred = segmentFromKeyword(`${stock.companyName} ${stock.fullName ?? ""} ${stock.subsector ?? ""} ${stock.sector ?? ""}`);
  return inferred ?? "Segmento em atualização";
}

export function displayAssetCategory(stock: StockData): string {
  if (isFiiAsset(stock)) return displayFiiSegment(stock);

  const sector = sanitizeDisplayText(stock.sector);
  if (sector && sector !== "Não disponível") return sector;

  const subsector = sanitizeDisplayText(stock.subsector);
  return subsector || "Não disponível";
}

export function displayAssetSubtitle(stock: StockData): { sector: string; subsector?: string } {
  if (isFiiAsset(stock)) {
    const segment = displayFiiSegment(stock);
    return {
      sector: "Fundos imobiliários",
      subsector: segment && !sameDisplayText(segment, "Segmento em atualização") ? segment : undefined,
    };
  }

  const sector = sanitizeDisplayText(stock.sector) || "Não disponível";
  const subsector = sameDisplayText(stock.subsector, sector) ? "" : sanitizeDisplayText(stock.subsector);

  return {
    sector,
    subsector: subsector || undefined,
  };
}
