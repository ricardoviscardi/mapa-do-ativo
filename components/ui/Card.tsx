import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return <div className={`min-w-0 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-sm ${className}`} {...props} />;
}
