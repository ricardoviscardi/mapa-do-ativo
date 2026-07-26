import type { BrapiAsset, BrapiEndpointResult } from "@/lib/stocks/brapi-client";

const FUNDAMENTUS_BASE_URL = "https://www.fundamentus.com.br";

type FundamentusPayload = Record<string, unknown>;

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&ccedil;/gi, "ç")
    .replace(/&atilde;/gi, "ã")
    .replace(/&aacute;/gi, "á")
    .replace(/&eacute;/gi, "é")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&uacute;/gi, "ú")
    .replace(/&acirc;/gi, "â")
    .replace(/&ecirc;/gi, "ê")
    .replace(/&ocirc;/gi, "ô")
    .replace(/&agrave;/gi, "à")
    .replace(/&Atilde;/g, "Ã")
    .replace(/&Ccedil;/g, "Ç");
}

function stripHtml(value: string): string {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/nº|n°|numero/g, "nro")
    .replace(/últ|ult/g, "ult")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseBrazilianNumber(value: string | undefined): number | null {
  if (!value) return null;
  if (value.trim() === "-" || value.trim() === "") return null;

  const negative = /^\s*-/.test(value);
  const cleaned = value
    .replace(/R\$/g, "")
    .replace(/%/g, "")
    .replace(/\s/g, "")
    .replace(/-/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");

  const parsed = Number(cleaned);

  if (!Number.isFinite(parsed)) return null;

  return negative ? -parsed : parsed;
}

function cellsFromRow(rowHtml: string): string[] {
  return [...rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
    .map((match) => stripHtml(match[1]))
    .filter(Boolean);
}

/**
 * O Fundamentus organiza várias tabelas com linhas do tipo:
 *   label | value | label | value
 * e também linhas de título com colspan. Se fizermos pares em uma lista global de
 * células, uma linha de título desloca todas as leituras seguintes. Por isso a
 * extração precisa ser por linha.
 */
function parsePairsFromRows(html: string): Record<string, string> {
  const raw: Record<string, string> = {};
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];

  for (const row of rows) {
    const cells = cellsFromRow(row[1]);

    if (cells.length < 2) continue;

    for (let index = 0; index < cells.length - 1; index += 2) {
      const label = cells[index];
      const value = cells[index + 1];

      if (!label || !value || label === value) continue;

      const key = normalizeKey(label);

      if (!key || key.length > 80) continue;

      raw[key] = value;
    }
  }

  return raw;
}

function pickRaw(raw: Record<string, string>, keys: string[]): string | undefined {
  for (const key of keys) {
    if (raw[key] !== undefined) return raw[key];
  }

  return undefined;
}

function pickNumber(raw: Record<string, string>, keys: string[]): number | null {
  return parseBrazilianNumber(pickRaw(raw, keys));
}

function detectKind(raw: Record<string, string>): "fii" | "stock" | "unknown" {
  if (
    raw.fii ||
    raw.mandato ||
    raw.gestao ||
    raw.segmento ||
    raw.nro_cotas ||
    raw.ffo_yield ||
    raw.ffo_cota ||
    raw.dividendo_cota ||
    raw.vp_cota
  ) {
    return "fii";
  }

  if (raw.papel || raw.tipo || raw.empresa || raw.nro_acoes) {
    return "stock";
  }

  return "unknown";
}

function hasUsefulValue(payload: FundamentusPayload): boolean {
  return Object.entries(payload).some(([key, value]) => {
    if (["symbol", "source", "kind", "raw"].includes(key)) return false;
    return value !== null && value !== undefined && value !== "";
  });
}

export async function fetchFundamentusSnapshot(ticker: string): Promise<BrapiAsset | null> {
  const normalizedTicker = normalizeTicker(ticker);
  if (!normalizedTicker) return null;

  const url = new URL("/detalhes.php", FUNDAMENTUS_BASE_URL);
  url.searchParams.set("papel", normalizedTicker);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 MapaDoAtivo/1.0",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Referer": "https://www.fundamentus.com.br/"
      },
      signal: AbortSignal.timeout(8000),
      next: {
        revalidate: 60 * 60 * 12
      }
    });

    if (!response.ok) return null;

    const html = await response.text();
    const raw = parsePairsFromRows(html);
    const kind = detectKind(raw);

    if (kind === "unknown") return null;

    const dividendYield = pickNumber(raw, ["div_yield", "dividend_yield"]);
    const dividendPerShare = pickNumber(raw, ["dividendo_cota", "dividendos_cota", "dividendo_por_cota", "dividend_rate"]);

    const pe = pickNumber(raw, ["p_l", "pl"]);
    const psr = pickNumber(raw, ["psr", "p_sr"]);
    const priceToBook = pickNumber(raw, ["p_vp"]);
    const priceToEbit = pickNumber(raw, ["p_ebit"]);
    const priceToAssets = pickNumber(raw, ["p_ativos"]);
    const priceToWorkingCapital = pickNumber(raw, ["p_cap_giro"]);
    const priceToCurrentAssets = pickNumber(raw, ["p_ativ_circ_liq"]);
    const evToEbit = pickNumber(raw, ["ev_ebit"]);
    const evToEbitda = pickNumber(raw, ["ev_ebitda"]);
    const grossMargin = pickNumber(raw, ["mrg_bruta", "margem_bruta"]);
    const ebitMargin = pickNumber(raw, ["mrg_ebit", "margem_ebit"]);
    const netMargin = pickNumber(raw, ["mrg_liq", "margem_liquida"]);
    const currentRatio = pickNumber(raw, ["liq_corr", "liquidez_corrente"]);
    const roic = pickNumber(raw, ["roic"]);
    const roe = pickNumber(raw, ["roe"]);
    const bookValue = pickNumber(raw, ["vp_cota", "vpa"]);
    const earningsPerShare = pickNumber(raw, ["lpa"]);
    const marketCap = pickNumber(raw, ["valor_de_mercado"]);
    const enterpriseValue = pickNumber(raw, ["valor_da_firma"]);
    const sharesOrQuotas = pickNumber(raw, ["nro_cotas", "nro_acoes"]);
    const price = pickNumber(raw, ["cotacao"]);
    const volumeAvg2m = pickNumber(raw, ["vol_med_2m", "vol_s_med_2m", "vol_med_2_m", "liquidez_2_meses", "liq_2meses"]);
    const patrimony = pickNumber(raw, ["patrim_liq", "patrim_liquido"]);
    const assets = pickNumber(raw, ["ativo", "ativos"]);
    const grossDebt = pickNumber(raw, ["div_bruta", "divida_bruta"]);
    const netDebt = pickNumber(raw, ["div_liq", "divida_liquida"]);
    const cash = pickNumber(raw, ["disponibilidades", "caixa"]);
    const debtToEquity = pickNumber(raw, ["div_br_patrim", "div_bruta_patrim"]);
    const revenue12m = pickNumber(raw, ["receita_liquida_12m", "receita_liquida", "receita"]);
    const ebit12m = pickNumber(raw, ["ebit_12m", "ebit"]);
    const netIncome12m = pickNumber(raw, ["lucro_liquido_12m", "lucro_liquido", "lucro"]);
    const revenueGrowth5y = pickNumber(raw, ["cresc_rec_5a", "crescimento_rec_5a"]);
    const distributedIncome12m = pickNumber(raw, ["rend_distribuido", "rendimento_distribuido"]);

    const capRate = pickNumber(raw, ["cap_rate"]);
    const vacancy = pickNumber(raw, ["vacancia_media"]);
    const propertiesCount = pickNumber(raw, ["qtd_imoveis"]);
    const unitsCount = pickNumber(raw, ["qtd_unidades"]);
    const areaM2 = pickNumber(raw, ["area_m2"]);
    const rentPerM2 = pickNumber(raw, ["aluguel_m2"]);
    const pricePerM2 = pickNumber(raw, ["preco_do_m2"]);

    const payload: FundamentusPayload = {
      symbol: normalizedTicker,
      source: "Fundamentus público",
      kind,
      raw,
      regularMarketPrice: price,
      price,
      marketCap,
      sharesOutstanding: sharesOrQuotas,
      regularMarketVolume: volumeAvg2m,
      averageVolume: volumeAvg2m,
      dividendYield,
      dividendRate: dividendPerShare,
      trailingAnnualDividendYield: dividendYield,
      trailingAnnualDividendRate: dividendPerShare,
      priceEarnings: pe,
      trailingPE: pe,
      peRatio: pe,
      priceToBook,
      pbRatio: priceToBook,
      priceToSales: psr,
      priceSales: psr,
      priceToEbit,
      pEbit: priceToEbit,
      priceToAssets,
      priceToWorkingCapital,
      priceToCurrentAssets,
      enterpriseValue,
      enterpriseToEbitda: evToEbitda,
      evToEbitda,
      enterpriseToEbit: evToEbit,
      evToEbit,
      grossMargins: grossMargin,
      grossMargin,
      operatingMargins: ebitMargin,
      ebitMargin,
      profitMargins: netMargin,
      netMargin,
      currentRatio,
      returnOnInvestedCapital: roic,
      roic,
      returnOnEquity: roe,
      roe,
      bookValue,
      bookValuePerShare: bookValue,
      earningsPerShare,
      lpa: earningsPerShare,
      totalDebt: grossDebt,
      grossDebt,
      netDebt,
      totalCash: cash,
      cash,
      debtToEquity,
      netDebtToEbitda: netDebt !== null && ebit12m ? netDebt / ebit12m : null,
      revenueGrowth5y,

      vpPerShare: bookValue,
      dividendPerShare,
      patrimony,
      totalEquity: patrimony,
      assets,
      totalAssets: assets,
      revenue12m,
      revenue: revenue12m,
      totalRevenue: revenue12m,
      ebit: ebit12m,
      operatingIncome: ebit12m,
      netIncome: netIncome12m,
      lastBalance: pickRaw(raw, ["ult_balanco_processado", "ult_informe_trimestral", "ultimo_informe_trimestral"]),
      quoteDate: pickRaw(raw, ["data_ult_cot"]),
      companyName: pickRaw(raw, ["nome", "empresa"]),
      longName: pickRaw(raw, ["nome", "empresa"]),
      sector: kind === "fii" ? "Fundos Imobiliários" : pickRaw(raw, ["setor"]),
      industry: kind === "fii" ? pickRaw(raw, ["segmento", "mandato"]) : pickRaw(raw, ["subsetor"]),
      mandate: pickRaw(raw, ["mandato"]),
      segment: pickRaw(raw, ["segmento"]),
      management: pickRaw(raw, ["gestao"]),
      reportDate: pickRaw(raw, ["relatorio"]),

      distributedIncome12m,
      capRate,
      vacancy,
      propertiesCount,
      unitsCount,
      areaM2,
      rentPerM2,
      pricePerM2,
      equity: {
        total: patrimony
      },
      assetsData: {
        total: assets
      },
      fiiResult: {
        revenue12m,
  
        distributedIncome12m
      },
      fiiRealEstate: {
        propertiesCount,
        unitsCount,
        areaM2,
        rentPerM2,
        pricePerM2,
        capRate,
        vacancy
      }
    };

    return hasUsefulValue(payload) ? payload : null;
  } catch {
    return null;
  }
}

export async function debugFundamentusTicker(ticker: string): Promise<BrapiEndpointResult[]> {
  const normalizedTicker = normalizeTicker(ticker);
  const url = new URL("/detalhes.php", FUNDAMENTUS_BASE_URL);
  url.searchParams.set("papel", normalizedTicker);
  const snapshot = await fetchFundamentusSnapshot(normalizedTicker);

  return [
    {
      endpoint: "fundamentus/detalhes",
      url: url.toString(),
      ok: Boolean(snapshot),
      status: snapshot ? 200 : 0,
      message: snapshot ? "Snapshot público encontrado." : "Snapshot público indisponível ou layout não reconhecido.",
      resultsLength: snapshot ? 1 : 0,
      firstResultKeys: snapshot ? Object.keys(snapshot).slice(0, 40) : []
    }
  ];
}
