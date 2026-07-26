import Link from "next/link";
import { Card } from "@/components/ui/Card";

const tools = [
  {
    title: "Calculadora de preço-teto",
    description: "Simule preço de referência por dividendos, retorno desejado e crescimento estimado.",
    href: "/ferramentas/preco-teto",
  },
  {
    title: "Simulador de proventos",
    description: "Projete aportes, rendimento estimado e reinvestimento em uma visão simples.",
    href: "/ferramentas/simulador-de-proventos",
  },
  {
    title: "Raio-X de carteira",
    description: "Veja distribuição entre ações, FIIs, setores, segmentos e rendimento médio estimado.",
    href: "/ferramentas/raio-x-carteira",
  },
  {
    title: "Comparador",
    description: "Compare ações e FIIs lado a lado antes de aprofundar a análise.",
    href: "/comparador",
  },
];

export function ToolsShowcase() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {tools.map((tool) => (
        <Link key={tool.href} href={tool.href}>
          <Card className="h-full transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-md">
            <h3 className="text-lg font-bold text-[var(--color-primary)]">{tool.title}</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{tool.description}</p>
            <span className="mt-4 inline-flex rounded-full border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-primary)]">
              Abrir ferramenta
            </span>
          </Card>
        </Link>
      ))}
    </div>
  );
}
