import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { HeroSearch } from "@/components/home/HeroSearch";

export default function StockNotFound() {
  return (
    <section className="container-page py-10">
      <Card className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-primary)]">Ação não encontrada</p>
        <h1 className="mt-3 text-3xl font-bold text-[var(--color-text)]">Não encontramos esse ticker.</h1>
        <p className="mx-auto mt-3 max-w-xl text-[var(--color-muted)]">Verifique se o código foi digitado corretamente ou pesquise outra ação brasileira.</p>
        <div className="mt-8">
          <HeroSearch compact />
        </div>
        <Link href="/acoes" className="mt-6 inline-flex text-sm font-semibold text-[var(--color-primary)]">
          Ver diretório de ações
        </Link>
      </Card>
    </section>
  );
}
