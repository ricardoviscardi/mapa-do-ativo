import Link from "next/link";
import { Card } from "@/components/ui/Card";

export type SeoHubStat = {
  label: string;
  value: string;
  description: string;
};

export type SeoHubSection = {
  title: string;
  description: string;
  bullets: string[];
};

export type SeoHubLink = {
  label: string;
  href: string;
  description?: string;
};

export type SeoHubFaq = {
  question: string;
  answer: string;
};

export type SeoHubPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  stats: SeoHubStat[];
  sections: SeoHubSection[];
  primaryLinks: SeoHubLink[];
  glossaryLinks: SeoHubLink[];
  faq: SeoHubFaq[];
};

export function SeoHubPage({
  eyebrow,
  title,
  description,
  stats,
  sections,
  primaryLinks,
  glossaryLinks,
  faq,
}: SeoHubPageProps) {
  return (
    <section className="container-page py-10">
      <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">{eyebrow}</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-[var(--color-text)] md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">{description}</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-gradient-to-br from-white to-blue-50/40">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-[var(--color-text)]">{stat.value}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{stat.description}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          {sections.map((section) => (
            <Card key={section.title}>
              <h2 className="text-2xl font-bold text-[var(--color-text)]">{section.title}</h2>
              <p className="mt-3 leading-7 text-[var(--color-muted)]">{section.description}</p>
              <ul className="mt-4 grid gap-3">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-alt)] p-4 text-sm leading-6 text-[var(--color-muted)]">
                    {bullet}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <aside className="grid content-start gap-5">
          <Card>
            <h2 className="text-xl font-bold">Ferramentas relacionadas</h2>
            <div className="mt-4 grid gap-3">
              {primaryLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-alt)] p-4 transition hover:border-[var(--color-primary)] hover:bg-white">
                  <span className="font-bold text-[var(--color-primary)]">{link.label}</span>
                  {link.description ? <span className="mt-1 block text-sm leading-6 text-[var(--color-muted)]">{link.description}</span> : null}
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">Aprenda os conceitos</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {glossaryLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-full border border-[var(--color-border)] px-3 py-2 text-xs font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]">
                  {link.label}
                </Link>
              ))}
            </div>
          </Card>
        </aside>
      </div>

      <Card className="mt-6">
        <h2 className="text-2xl font-bold">Perguntas frequentes</h2>
        <div className="mt-4 grid gap-3">
          {faq.map((item) => (
            <details key={item.question} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-alt)] p-4">
              <summary className="cursor-pointer font-bold text-[var(--color-text)]">{item.question}</summary>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{item.answer}</p>
            </details>
          ))}
        </div>
      </Card>
    </section>
  );
}
