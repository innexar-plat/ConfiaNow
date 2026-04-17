import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryDiscovery } from "@platform/discovery";
import { Eyebrow, InfoCard, Pill, Surface } from "../../../../../../packages/ui/src";

export default async function CategoryDiscoveryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const discovery = await getCategoryDiscovery(slug);

    return (
      <main style={{ minHeight: "100vh", padding: 24 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gap: 20 }}>
          <Surface>
            <Eyebrow>Categoria publica</Eyebrow>
            <h1 style={{ margin: "12px 0" }}>{discovery.category.name}</h1>
            <p style={{ color: "var(--muted)" }}>{discovery.category.businessCount} negocios publicados nesta categoria.</p>
            <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Pill>Slug: {discovery.category.slug}</Pill>
              <Link href={`/?category=${discovery.category.slug}`}>Filtrar na home</Link>
            </div>
          </Surface>

          <Surface>
            <Eyebrow>Negocios</Eyebrow>
            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              {discovery.businesses.length > 0 ? discovery.businesses.map((business) => (
                <InfoCard key={business.id}>
                  <strong>{business.businessName}</strong>
                  {business.headline ? <p style={{ color: "var(--muted)" }}>{business.headline}</p> : null}
                  <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {business.city ? <Pill>{business.city}{business.stateCode ? ` - ${business.stateCode}` : ""}</Pill> : null}
                    {business.trustBadge !== "none" ? <Pill>Selo {business.trustBadge}</Pill> : null}
                    <Pill>Trust {business.trustScore}</Pill>
                    <Pill>Discovery {Math.round(business.rankingScore)}</Pill>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <Link href={`/businesses/${business.slug}`}>Abrir perfil publico</Link>
                  </div>
                </InfoCard>
              )) : <p style={{ color: "var(--muted)" }}>Ainda nao existem negocios publicados nesta categoria.</p>}
            </div>
          </Surface>
        </div>
      </main>
    );
  } catch {
    notFound();
  }
}