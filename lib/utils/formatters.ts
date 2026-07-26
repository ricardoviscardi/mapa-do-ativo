type NumericLike = number | string | null | undefined;

export function toFiniteNumber(value: NumericLike): number | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "nan") return null;

  const hasComma = trimmed.includes(",");
  const hasDot = trimmed.includes(".");
  const normalized = hasComma
    ? (hasDot ? trimmed.replace(/\./g, "").replace(",", ".") : trimmed.replace(",", "."))
    : trimmed;

  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function formatCurrency(value: NumericLike): string {
  const numberValue = toFiniteNumber(value);

  if (numberValue === null) {
    return "Não disponível";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(numberValue);
}

export function formatPercent(value: NumericLike): string {
  const numberValue = toFiniteNumber(value);

  if (numberValue === null) {
    return "Não disponível";
  }

  const sign = numberValue > 0 ? "+" : "";

  return `${sign}${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numberValue)}%`;
}

export function formatPlainPercent(value: NumericLike): string {
  const numberValue = toFiniteNumber(value);

  if (numberValue === null) {
    return "Não disponível";
  }

  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numberValue)}%`;
}

export function formatNumber(value: NumericLike): string {
  const numberValue = toFiniteNumber(value);

  if (numberValue === null) {
    return "Não disponível";
  }

  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2
  }).format(numberValue);
}

export function formatInteger(value: NumericLike): string {
  const numberValue = toFiniteNumber(value);

  if (numberValue === null) {
    return "Não disponível";
  }

  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0
  }).format(numberValue);
}

export function formatLargeCurrency(value: NumericLike): string {
  const numberValue = toFiniteNumber(value);

  if (numberValue === null) {
    return "Não disponível";
  }

  if (Math.abs(numberValue) >= 1_000_000_000_000) {
    return `R$ ${formatNumber(numberValue / 1_000_000_000_000)} tri`;
  }

  if (Math.abs(numberValue) >= 1_000_000_000) {
    return `R$ ${formatNumber(numberValue / 1_000_000_000)} bi`;
  }

  if (Math.abs(numberValue) >= 1_000_000) {
    return `R$ ${formatNumber(numberValue / 1_000_000)} mi`;
  }

  return formatCurrency(numberValue);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Não disponível";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo"
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo"
    });
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short"
  });
}
