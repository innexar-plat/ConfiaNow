import React from "react";

type SectionProps = {
  section: {
    id: string;
    type: string;
    order: number;
    title: string | null;
    body: string | null;
    metadata: unknown;
  };
};

function Section({ section }: SectionProps) {
  return (
    <div
      data-testid={`cms-section-${section.type}`}
      style={{
        padding: "20px 0",
        borderBottom: "1px solid var(--border, #e5e7eb)"
      }}
    >
      {section.title ? (
        <h2 style={{ marginBottom: 12 }}>{section.title}</h2>
      ) : null}
      {section.body ? (
        <p style={{ color: "var(--muted)", lineHeight: 1.75 }}>{section.body}</p>
      ) : null}
    </div>
  );
}

type CmsPageRendererProps = {
  sections: SectionProps["section"][];
};

export function CmsPageRenderer({ sections }: CmsPageRendererProps) {
  if (sections.length === 0) {
    return (
      <p data-testid="cms-empty" style={{ color: "var(--muted)" }}>
        Esta pagina ainda nao possui conteudo publicado.
      </p>
    );
  }

  return (
    <div data-testid="cms-renderer">
      {sections.map((section) => (
        <Section key={section.id} section={section} />
      ))}
    </div>
  );
}
