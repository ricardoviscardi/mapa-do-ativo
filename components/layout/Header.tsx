import Link from "next/link";
import { SearchMini } from "@/components/search/SearchMini";

const links = [
  { href: "/acoes", label: "Ações" },
  { href: "/fiis", label: "FIIs" },
  { href: "/rankings", label: "Rankings" },
  { href: "/ferramentas", label: "Ferramentas" },
  { href: "/comparador", label: "Comparador" },
  { href: "/glossario", label: "Glossário" },
  { href: "/metodologia", label: "Metodologia" },
  { href: "/sobre", label: "Sobre" }
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-white/92 backdrop-blur">
      <div className="flex min-h-16 w-full items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-8">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 font-bold text-[var(--color-primary)]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)] text-sm text-white">
              MA
            </span>
            <span className="text-lg">Mapa do Ativo</span>
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-medium text-[var(--color-muted)] md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-[var(--color-primary)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden w-64 shrink-0 lg:block">
          <SearchMini />
        </div>
      </div>
    </header>
  );
}
