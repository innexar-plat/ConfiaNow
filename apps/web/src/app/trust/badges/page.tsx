import Link from "next/link";
import { listBadgeLevels } from "@platform/trust";
import { Eyebrow, InfoCard, Pill, Surface } from "../../../../../../packages/ui/src";

export default async function TrustBadgesPage() {
  const levels = await listBadgeLevels();

  return (
    <main style={{ minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gap: 20 }}>
        <Surface>
          <Eyebrow>Programa de confianca</Eyebrow>
          <h1 style={{ margin: "12px 0" }}>Como funciona o selo de confianca</h1>
          <p style={{ color: "var(--muted)", maxWidth: 760 }}>
            O selo inicial considera verificacao aprovada, completude do perfil publicado e responsividade a leads reais. Suspensoes administrativas removem o badge publico ate nova restauracao.
          </p>
          <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Pill>Verificacao</Pill>
            <Pill>Completude</Pill>
            <Pill>Resposta a leads</Pill>
          </div>
        </Surface>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {levels.map((level) => (
            <InfoCard key={level.code}>
              <strong>{level.label}</strong>
              <p style={{ color: "var(--muted)" }}>{level.description}</p>
              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Pill>Score minimo {level.minScore}</Pill>
              </div>
            </InfoCard>
          ))}
        </section>

        <Surface>
          <Eyebrow>Leitura publica</Eyebrow>
          <p style={{ color: "var(--muted)" }}>
            O badge aparece nos cards de discovery e no perfil publico do negocio. Acompanhe um exemplo real voltando para a <Link href="/">home</Link> ou abrindo um negocio publicado.
          </p>
        </Surface>
      </div>
    </main>
  );
}