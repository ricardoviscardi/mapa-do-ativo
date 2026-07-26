type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <div className="mb-8 max-w-3xl">
      {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">{eyebrow}</p> : null}
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-text)] md:text-4xl">{title}</h1>
      {description ? <p className="mt-3 text-base leading-7 text-[var(--color-muted)]">{description}</p> : null}
    </div>
  );
}
