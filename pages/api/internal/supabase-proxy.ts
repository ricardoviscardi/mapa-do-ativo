import type { NextApiRequest, NextApiResponse } from "next";
import https from "node:https";

type ProxyOperation = "select" | "upsert" | "delete" | "count";

type ProxyPayload = {
  op: ProxyOperation;
  table: string;
  params?: Record<string, string | number | boolean | null | undefined>;
  filters?: Record<string, string | number | boolean | null | undefined>;
  rows?: Record<string, unknown>[] | Record<string, unknown>;
  on_conflict?: string;
};

type NodeHttpResult = {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  text: string;
};

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
}

function getSupabaseKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  );
}

function isValidIdentifier(value: string) {
  return /^[a-zA-Z0-9_]+$/.test(value);
}

function getExpectedToken() {
  if (process.env.INTERNAL_UPDATE_TOKEN) return process.env.INTERNAL_UPDATE_TOKEN;
  return process.env.NODE_ENV === "production" ? "" : "dev-local-update-token";
}

function isProxyWriteEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.INTERNAL_PROXY_ENABLED === "true";
}

function hasAccess(req: NextApiRequest) {
  const expected = getExpectedToken();
  const headerToken = req.headers["x-internal-token"];
  const auth = req.headers.authorization;
  const bearerToken = auth?.toLowerCase().startsWith("bearer ") ? auth.slice(7) : null;

  return Boolean(expected) && (headerToken === expected || bearerToken === expected);
}

function allowInsecureLocalTls() {
  return process.env.LOCAL_PROXY_INSECURE_TLS === "true" && process.env.NODE_ENV !== "production";
}

function buildUrl(baseUrl: string, table: string, params?: ProxyPayload["params"]) {
  const url = new URL(`${baseUrl}/rest/v1/${table}`);

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function supabaseHeaders(extraHeaders?: Record<string, string>) {
  const key = getSupabaseKey();

  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada no ambiente do Next.js.");
  }

  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(extraHeaders ?? {})
  };
}

function requestWithNodeHttps(url: string, init: { method?: string; headers?: Record<string, string>; body?: string } = {}) {
  return new Promise<NodeHttpResult>((resolve, reject) => {
    const parsedUrl = new URL(url);
    const request = https.request(
      {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port ? Number(parsedUrl.port) : 443,
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        method: init.method ?? "GET",
        headers: init.headers,
        family: 4,
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
      request.destroy(new Error("Timeout ao conectar ao Supabase pelo proxy Node HTTPS."));
    });

    request.on("error", (error) => {
      reject(error);
    });

    if (init.body) {
      request.write(init.body);
    }

    request.end();
  });
}

async function supabaseRequest(url: string, init: { method?: string; headers?: Record<string, string>; body?: string } = {}) {
  return requestWithNodeHttps(url, {
    ...init,
    headers: supabaseHeaders(init.headers)
  });
}

function parseBody(text: string) {
  if (!text) return [];
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json({
      ok: isProxyWriteEnabled(),
      message: isProxyWriteEnabled()
        ? "Proxy interno ativo via Pages API."
        : "Proxy interno desativado em produção. Defina INTERNAL_PROXY_ENABLED=true e INTERNAL_UPDATE_TOKEN apenas se houver necessidade real.",
      runtime: "pages-api-node",
      mode: "node:https",
      urlConfigured: Boolean(getSupabaseUrl()),
      keyConfigured: Boolean(getSupabaseKey()),
      tokenConfigured: Boolean(process.env.INTERNAL_UPDATE_TOKEN),
      insecureTlsLocalOnly: allowInsecureLocalTls()
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Método não permitido." });
  }

  if (!isProxyWriteEnabled()) {
    return res.status(404).json({ ok: false, message: "Proxy interno desativado em produção." });
  }

  if (!hasAccess(req)) {
    return res.status(401).json({ ok: false, message: "Acesso interno negado." });
  }

  const baseUrl = getSupabaseUrl();
  if (!baseUrl) {
    return res.status(500).json({ ok: false, message: "SUPABASE_URL não configurada." });
  }

  const payload = req.body as ProxyPayload;

  if (!payload?.table || !isValidIdentifier(payload.table)) {
    return res.status(400).json({ ok: false, message: "Tabela inválida." });
  }

  try {
    if (payload.op === "select") {
      const response = await supabaseRequest(buildUrl(baseUrl, payload.table, payload.params));

      if (response.status < 200 || response.status >= 300) {
        return res.status(response.status).json({ ok: false, status: response.status, message: response.text });
      }

      return res.status(200).json({ ok: true, status: response.status, data: parseBody(response.text) });
    }

    if (payload.op === "count") {
      const response = await supabaseRequest(buildUrl(baseUrl, payload.table, { select: "id", limit: 1 }), {
        headers: { Prefer: "count=planned" }
      });

      if (response.status < 200 || response.status >= 300) {
        return res.status(response.status).json({ ok: false, status: response.status, message: response.text });
      }

      const contentRange = String(response.headers["content-range"] ?? "");
      const countText = contentRange.split("/").at(-1);
      const count = countText && countText !== "*" ? Number(countText) : 0;

      return res.status(200).json({ ok: true, status: response.status, count: Number.isFinite(count) ? count : 0 });
    }

    if (payload.op === "upsert") {
      const params: Record<string, string> = {};
      if (payload.on_conflict) params.on_conflict = payload.on_conflict;

      const response = await supabaseRequest(buildUrl(baseUrl, payload.table, params), {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(payload.rows ?? [])
      });

      if (response.status < 200 || response.status >= 300) {
        return res.status(response.status).json({ ok: false, status: response.status, message: response.text });
      }

      return res.status(200).json({ ok: true, status: response.status });
    }

    if (payload.op === "delete") {
      const response = await supabaseRequest(buildUrl(baseUrl, payload.table, payload.filters), {
        method: "DELETE"
      });

      if (response.status < 200 || response.status >= 300) {
        return res.status(response.status).json({ ok: false, status: response.status, message: response.text });
      }

      return res.status(200).json({ ok: true, status: response.status });
    }

    return res.status(400).json({ ok: false, message: "Operação inválida." });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : "Falha no proxy interno.",
      hint: error instanceof Error && error.message.includes("local issuer certificate")
        ? "Certificado TLS bloqueado pelo ambiente local. A v1.52 permite LOCAL_PROXY_INSECURE_TLS=true apenas em desenvolvimento. Reinicie o npm run dev."
        : "O endpoint está em pages/api. Reinicie o npm run dev depois de substituir a pasta."
    });
  }
}
