import https from "node:https";

export type SupabaseConnectionStatus = {
  configured: boolean;
  url?: string;
  keyConfigured: boolean;
  keyType: "publishable" | "secret" | "jwt" | "unknown" | "missing";
  message?: string;
};

export type SupabaseTableStatus = {
  table: string;
  ok: boolean;
  status: number;
  count?: number | null;
  sampleKeys?: string[];
  message?: string;
};

type SupabaseSelectOptions = {
  select?: string;
  filters?: Record<string, string>;
  order?: string;
  limit?: number;
  offset?: number;
};

type SupabaseTableCheckOptions = {
  /**
   * `exact` pode causar timeout em tabelas grandes no Supabase/PostgREST.
   * Para endpoints de diagnóstico, `planned` é suficiente para confirmar saúde da tabela
   * sem derrubar o status por causa de uma contagem pesada.
   */
  count?: "exact" | "planned" | "none";
  select?: string;
  limit?: number;
};

type NodeHttpResult = {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  text: string;
};

function cleanUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.replace(/\/+$/, "");
}

export function getSupabaseUrl(): string | undefined {
  return cleanUrl(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getSupabaseKeyType(key = getSupabaseKey()): SupabaseConnectionStatus["keyType"] {
  if (!key) return "missing";
  if (key.startsWith("sb_publishable_")) return "publishable";
  if (key.startsWith("sb_secret_")) return "secret";
  if (key.split(".").length === 3) return "jwt";
  return "unknown";
}

export function getSupabaseConnectionStatus(): SupabaseConnectionStatus {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  const keyType = getSupabaseKeyType(key);

  if (!url || !key) {
    return {
      configured: false,
      url,
      keyConfigured: Boolean(key),
      keyType,
      message: "Configure SUPABASE_URL e uma chave do Supabase no .env.local."
    };
  }

  return {
    configured: true,
    url,
    keyConfigured: true,
    keyType,
    message: keyType === "publishable"
      ? "Conectado com chave publicável. Serve para leitura/teste; para scripts de gravação, use secret/service_role."
      : "Configuração encontrada."
  };
}

function allowInsecureLocalTls() {
  return process.env.LOCAL_PROXY_INSECURE_TLS === "true" && process.env.NODE_ENV !== "production";
}

function forceIPv4() {
  return process.env.SUPABASE_FORCE_IPV4 !== "false";
}

function buildRestUrl(table: string, options: SupabaseSelectOptions = {}): string {
  const baseUrl = getSupabaseUrl();
  if (!baseUrl) {
    throw new Error("SUPABASE_URL não configurado.");
  }

  const url = new URL(`${baseUrl}/rest/v1/${table}`);
  url.searchParams.set("select", options.select ?? "*");

  for (const [key, value] of Object.entries(options.filters ?? {})) {
    url.searchParams.set(key, value);
  }

  if (options.order) {
    url.searchParams.set("order", options.order);
  }

  if (options.limit) {
    url.searchParams.set("limit", String(options.limit));
  }

  if (options.offset) {
    url.searchParams.set("offset", String(options.offset));
  }

  return url.toString();
}

function supabaseHeaders(extraHeaders?: Record<string, string>) {
  const key = getSupabaseKey();

  if (!key) {
    throw new Error("Chave do Supabase não configurada.");
  }

  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
    ...(extraHeaders ?? {})
  };
}

function requestWithNodeHttps(
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string } = {}
): Promise<NodeHttpResult> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const request = https.request(
      {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port ? Number(parsedUrl.port) : 443,
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        method: init.method ?? "GET",
        headers: init.headers,
        family: forceIPv4() ? 4 : undefined,
        minVersion: "TLSv1.2",
        servername: parsedUrl.hostname,
        timeout: 120_000,
        rejectUnauthorized: !allowInsecureLocalTls()
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        response.on("end", () => {
          resolve({
            status: response.statusCode ?? 0,
            headers: response.headers,
            text: Buffer.concat(chunks).toString("utf8")
          });
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(new Error("Timeout ao conectar ao Supabase."));
    });

    request.on("error", (error) => reject(error));

    if (init.body) request.write(init.body);
    request.end();
  });
}

async function supabaseRequest(
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string } = {}
) {
  return requestWithNodeHttps(url, {
    ...init,
    headers: supabaseHeaders(init.headers)
  });
}

function parseJsonArray<T>(text: string): T[] {
  if (!text) return [];
  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

export async function supabaseSelect<T>(table: string, options: SupabaseSelectOptions = {}): Promise<T[]> {
  const response = await supabaseRequest(buildRestUrl(table, options), {
    headers: { "Content-Type": "application/json" }
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Supabase ${table} respondeu ${response.status}: ${response.text}`);
  }

  return parseJsonArray<T>(response.text);
}

export async function supabaseSelectPaged<T>(
  table: string,
  options: Omit<SupabaseSelectOptions, "limit" | "offset"> = {},
  totalLimit = 2600,
  pageSize = 1000
): Promise<T[]> {
  const allRows: T[] = [];
  let offset = 0;

  while (allRows.length < totalLimit) {
    const remaining = totalLimit - allRows.length;
    const currentLimit = Math.min(pageSize, remaining);
    const rows = await supabaseSelect<T>(table, {
      ...options,
      limit: currentLimit,
      offset
    });

    allRows.push(...rows);

    if (rows.length < currentLimit) {
      break;
    }

    offset += currentLimit;
  }

  return allRows;
}

export async function checkSupabaseTable(
  table: string,
  options: SupabaseTableCheckOptions = {},
): Promise<SupabaseTableStatus> {
  const key = getSupabaseKey();

  if (!key) {
    return {
      table,
      ok: false,
      status: 0,
      message: "Chave do Supabase não configurada."
    };
  }

  const countMode = options.count ?? "planned";

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (countMode !== "none") {
      headers.Prefer = `count=${countMode}`;
    }

    const response = await supabaseRequest(buildRestUrl(table, {
      select: options.select ?? "*",
      limit: options.limit ?? 1,
    }), { headers });

    let rows: unknown[] = [];

    try {
      rows = response.text ? JSON.parse(response.text) as unknown[] : [];
    } catch {
      rows = [];
    }

    const contentRange = response.headers["content-range"];
    const contentRangeText = Array.isArray(contentRange) ? contentRange[0] : contentRange;
    const countText = contentRangeText?.split("/").at(-1);
    const count = countText && countText !== "*" ? Number(countText) : null;
    const first = Array.isArray(rows) ? rows[0] : undefined;

    return {
      table,
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      count: Number.isFinite(count) ? count : null,
      sampleKeys: first && typeof first === "object" ? Object.keys(first as Record<string, unknown>).slice(0, 12) : [],
      message: response.status >= 200 && response.status < 300 ? undefined : response.text
    };
  } catch (error) {
    return {
      table,
      ok: false,
      status: 0,
      message: error instanceof Error ? error.message : "Falha ao consultar Supabase."
    };
  }
}
