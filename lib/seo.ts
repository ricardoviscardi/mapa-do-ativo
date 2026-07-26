const DEFAULT_SITE_URL = "https://www.mapadoativo.com.br";

function normalizeUrl(value: string | undefined | null): string | null {
  if (!value) return null;
  const clean = value.trim().replace(/\/$/, "");
  if (!clean) return null;
  if (/localhost|127\.0\.0\.1/i.test(clean) && process.env.NODE_ENV === "production") return null;
  return clean;
}

export function getBaseUrl(): string {
  const explicit = normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (explicit) return explicit;

  const vercelProduction = normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null);
  if (vercelProduction) return vercelProduction;

  const vercelPreview = normalizeUrl(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  if (vercelPreview) return vercelPreview;

  return DEFAULT_SITE_URL;
}
