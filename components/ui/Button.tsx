import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className = "", ...props }: ButtonProps) {
  return (
    <button className={`focus-ring inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white transition hover:opacity-90 ${className}`} {...props} />
  );
}
