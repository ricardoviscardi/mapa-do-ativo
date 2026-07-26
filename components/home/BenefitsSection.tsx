import { Card } from "@/components/ui/Card";

const benefits = [
  { title: "Entenda antes de investir", description: "Veja os principais indicadores de uma empresa sem precisar abrir várias abas." },
  { title: "Dados em uma tela limpa", description: "Cotação, múltiplos, balanço e resultados organizados por prioridade." },
  { title: "Feito para iniciantes", description: "Cada indicador vem com explicação simples e objetiva." },
  { title: "Transparência nos dados", description: "Mostramos fonte e data de atualização sempre que possível." }
];

export function BenefitsSection() {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {benefits.map((benefit) => (
        <Card key={benefit.title}>
          <h3 className="font-bold">{benefit.title}</h3>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{benefit.description}</p>
        </Card>
      ))}
    </div>
  );
}
