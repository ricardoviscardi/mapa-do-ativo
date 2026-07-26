import type { StockData } from "@/types/stock";

type ApiStatusNoticeProps = {
  stock: StockData;
};

export function ApiStatusNotice({ stock }: ApiStatusNoticeProps) {
  const shouldShow = process.env.NEXT_PUBLIC_SHOW_DATA_WARNINGS === "true";

  if (!shouldShow || !stock.warnings.length) {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm leading-6 text-[var(--color-muted)] shadow-sm">
      <details>
        <summary className="cursor-pointer font-semibold text-[var(--color-text)]">
          Disponibilidade dos dados
        </summary>
        <ul className="mt-3 list-inside list-disc">
          {stock.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
