import Link from "next/link";
import type { Metadata } from "next";
import { getCitySeoData, getCityPageBusinesses } from "@platform/cms";
import { Eyebrow, InfoCard, Pill, Surface } from "../../../../../../packages/ui/src";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const seo = await getCitySeoData(slug);
    return {
      title: seo.title,
      description: seo.description ?? undefined,
      openGraph: seo.ogImage ? { images: [seo.ogImage] } : undefined
    };
  } catch {
    return { title: slug };
  }
}

export default async function CityLandingPage({ params }: Props) {
  const { slug } = await params;
  const [seo, businesses] = await Promise.all([
    getCitySeoData(slug),
    getCityPageBusinesses(slug)
  ]);

  const cityLabel = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");

  return (
    <main style={{ minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 20 }}>
        <Surface>
          <Eyebrow>Cidade</Eyebrow>
          <h1 style={{ margin: "12px 0" }}>{seo.title}</h1>
          {seo.description ? (
            <p style={{ color: "var(--muted)", maxWidth: 760 }}>{seo.description}</p>
          ) : null}
          <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
            <Pill>{businesses.length} profissional(is) verificado(s)</Pill>
            <Pill>{cityLabel}</Pill>
          </div>
          <div style={{ marginTop: 16 }}>
            <Link href="/">← Voltar para inicio</Link>
          </div>
        </Surface>

        {businesses.length === 0 ? (
          <Surface>
            <p style={{ color: "var(--muted)" }}>
              Nenhum profissional verificado encontrado em {cityLabel} ainda.{" "}
              <Link href="/register">Cadastre seu negocio</Link>.
            </p>
          </Surface>
        ) : (
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {businesses.map((b) => (
              <InfoCard key={b.id}>
                <strong>
                  <Link href={`/businesses/${b.slug}`}>{b.businessName}</Link>
                </strong>
                {b.headline ? <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>{b.headline}</p> : null}
                <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {b.trustScore ? <Pill>Score {b.trustScore}</Pill> : null}
                  {b.cityName ? <Pill>{b.cityName}</Pill> : null}
                  {b.categorySlugs.slice(0, 2).map((cat) => (
                    <Pill key={cat}>{cat}</Pill>
                  ))}
                </div>
              </InfoCard>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
