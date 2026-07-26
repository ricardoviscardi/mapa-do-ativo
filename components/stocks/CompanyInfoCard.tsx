import type { CompanyInfoRow } from "@/types/stock";
import { Card } from "@/components/ui/Card";
import { sameDisplayText, sanitizeDisplayText } from "@/lib/utils/text";

type CompanyInfoCardProps = {
  rows: CompanyInfoRow[];
};

function displayValue(row: CompanyInfoRow) {
  const rawValue = String(row.value ?? "").trim();
  const value = sanitizeDisplayText(row.value) || "Não disponível";

  // Campos com artefato de encoding ou unidade quebrada passam sensação de dado corrompido.
  // Melhor ocultar o campo do que exibir algo como "M?s" ou "?" na ficha pública.
  if (rawValue.includes("�") || rawValue.includes("?") || value.includes("?")) {
    return "Não disponível";
  }

  if (row.label === "Site" && value !== "Não disponível") {
    return value
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/$/, "");
  }

  return value;
}

function normalizeRows(rows: CompanyInfoRow[]) {
  const sanitizedRows = rows.map((row) => ({
    label: row.label,
    value: displayValue(row)
  }));

  const sector = sanitizedRows.find((row) => row.label === "Setor")?.value;

  return sanitizedRows.filter((row) => {
    if (["CNPJ", "Site", "Mandato", "Gestão"].includes(row.label) && row.value === "Não disponível") {
      return false;
    }

    if ((row.label === "Indústria" || row.label === "Segmento") && sameDisplayText(row.value, sector)) {
      return false;
    }

    return true;
  });
}

export function CompanyInfoCard({ rows }: CompanyInfoCardProps) {
  const visibleRows = normalizeRows(rows);

  return (
    <Card>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
        Empresa
      </p>

      <div className="mt-5 grid gap-3">
        {visibleRows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] pb-3 last:border-b-0 last:pb-0">
            <p className="text-sm text-[var(--color-muted)]">{row.label}</p>
            <p className="min-w-0 max-w-[58%] break-all text-right text-sm font-bold leading-5 text-[var(--color-text)]">
              {row.value}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
