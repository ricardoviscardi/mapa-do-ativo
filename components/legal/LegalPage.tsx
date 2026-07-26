import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

type LegalSection = {
  title: string;
  content: string;
};

type LegalPageProps = {
  title: string;
  description: string;
  sections: LegalSection[];
};

export function LegalPage({ title, description, sections }: LegalPageProps) {
  return (
    <section className="container-page py-10">
      <SectionHeader eyebrow="Legal" title={title} description={description} />
      <div className="grid gap-5">
        {sections.map((section) => (
          <Card key={section.title}>
            <h2 className="text-xl font-bold">{section.title}</h2>
            <p className="mt-3 leading-7 text-[var(--color-muted)]">{section.content}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
