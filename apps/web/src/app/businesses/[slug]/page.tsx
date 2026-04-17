import Link from "next/link";
import { notFound } from "next/navigation";
import { trackPublicProfileView } from "@platform/analytics";
import { getPublicBusinessBySlug } from "@platform/profiles";
import { listPublicBusinessReviews } from "@platform/reviews";
import { Eyebrow, InfoCard, Pill, Surface } from "../../../../../../packages/ui/src";
import { getDemoSession } from "../../../lib/session";

export default async function PublicBusinessProfilePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const business = await getPublicBusinessBySlug(slug);
    const reviews = await listPublicBusinessReviews(business.profile.id);
    const session = await getDemoSession();
    await trackPublicProfileView({
      businessSlug: business.profile.slug,
      actorUserId: session.id
    });

    return (
      <main style={{ minHeight: "100vh", padding: 24 }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 20 }}>
          <Surface>
            <Eyebrow>Perfil publico</Eyebrow>
            <h1 style={{ margin: "12px 0" }}>{business.profile.businessName}</h1>
            <p style={{ color: "var(--muted)", maxWidth: 760 }}>
              {business.profile.headline ?? "Negocio verificado em construcao dentro do catalogo publico da plataforma."}
            </p>

            <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
              {business.profile.trust?.badgeCode !== "none" ? <Pill>Selo {business.profile.trust?.badgeLabel}</Pill> : null}
              {business.profile.trust ? <Pill>Trust {business.profile.trust.score}</Pill> : null}
              {business.profile.city ? <Pill>{business.profile.city}</Pill> : null}
              {business.profile.state ? <Pill>{business.profile.state}</Pill> : null}
              {business.profile.serviceArea ? <Pill>{business.profile.serviceArea}</Pill> : null}
              {business.profile.yearsInBusiness ? <Pill>{business.profile.yearsInBusiness} anos de experiencia</Pill> : null}
            </div>

            {business.profile.trust ? (
              <div style={{ marginTop: 20 }}>
                <InfoCard>
                  <strong>Confianca publicada</strong>
                  <p style={{ color: "var(--muted)" }}>
                    {business.profile.trust.badgeLabel} com score {business.profile.trust.score}. Veja como o programa funciona em <Link href="/trust/badges">selo de confianca</Link>.
                  </p>
                </InfoCard>
              </div>
            ) : null}

            {business.profile.description ? (
              <p style={{ marginTop: 20, color: "var(--muted)", lineHeight: 1.7 }}>{business.profile.description}</p>
            ) : null}

            <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
              {business.profile.publicEmail ? <Link href={`/track/contact?businessSlug=${business.profile.slug}&channel=email&target=${encodeURIComponent(`mailto:${business.profile.publicEmail}`)}`}>Enviar e-mail</Link> : null}
              {business.profile.publicPhone ? <Link href={`/track/contact?businessSlug=${business.profile.slug}&channel=phone&target=${encodeURIComponent(`tel:${business.profile.publicPhone}`)}`}>Ligar agora</Link> : null}
              <Link href="/signin">Entrar na plataforma</Link>
            </div>

            <div style={{ marginTop: 24 }}>
              <InfoCard>
                <strong>Solicitar contato</strong>
                <p style={{ color: "var(--muted)" }}>Envie sua necessidade para este negocio e acompanhe a resposta no seu historico.</p>
                {session.isAuthenticated && session.role === "client" ? (
                  <form action="/auth/leads" method="post" style={{ display: "grid", gap: 10, marginTop: 14 }}>
                    <input type="hidden" name="businessSlug" value={business.profile.slug} />
                    <input name="subject" placeholder="Resumo do que voce precisa" required style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
                    <textarea name="message" placeholder="Descreva prazo, local e detalhes importantes" required rows={4} style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
                    <button type="submit" style={{ border: 0, borderRadius: 999, padding: "12px 16px", background: "var(--accent)", color: "#fff", cursor: "pointer" }}>
                      Enviar lead
                    </button>
                  </form>
                ) : (
                  <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <p style={{ color: "var(--muted)" }}>Para enviar um lead, entre com uma conta de cliente autenticada.</p>
                    <Link href="/signin">Entrar para enviar lead</Link>
                  </div>
                )}
              </InfoCard>
            </div>
          </Surface>

          {business.profile.categories.length > 0 ? (
            <Surface>
              <Eyebrow>Categorias</Eyebrow>
              <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
                {business.profile.categories.map((category) => (
                  <Pill key={category.id}>{category.name}</Pill>
                ))}
              </div>
            </Surface>
          ) : null}

          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            <Surface>
              <Eyebrow>Servicos</Eyebrow>
              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {business.services.length > 0 ? business.services.map((service) => (
                  <InfoCard key={service.id}>
                    <strong>{service.title}</strong>
                    {service.description ? <p style={{ color: "var(--muted)" }}>{service.description}</p> : null}
                    {service.priceLabel ? <Pill>{service.priceLabel}</Pill> : null}
                  </InfoCard>
                )) : <p style={{ color: "var(--muted)" }}>Este negocio ainda nao publicou servicos.</p>}
              </div>
            </Surface>

            <Surface>
              <Eyebrow>Portfolio</Eyebrow>
              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {business.portfolioItems.length > 0 ? business.portfolioItems.map((item) => (
                  <InfoCard key={item.id}>
                    <strong>{item.title}</strong>
                    {item.description ? <p style={{ color: "var(--muted)" }}>{item.description}</p> : null}
                    {item.mediaUrl ? <p style={{ color: "var(--accent-strong)" }}>Midia: {item.mediaUrl}</p> : null}
                  </InfoCard>
                )) : <p style={{ color: "var(--muted)" }}>O portfolio publico sera exibido aqui quando houver itens publicados.</p>}
              </div>
            </Surface>
          </section>

          <Surface>
            <Eyebrow>Reputacao publicada</Eyebrow>
            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Pill>{reviews.summary.approvedCount} reviews aprovadas</Pill>
              {reviews.summary.averageRating ? <Pill>Media {reviews.summary.averageRating.toFixed(1)}/5</Pill> : null}
            </div>

            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              {reviews.items.length > 0 ? reviews.items.map((review) => (
                <InfoCard key={review.id}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <strong>{review.title}</strong>
                    <Pill>{review.rating}/5</Pill>
                    <Pill>{review.clientDisplayName}</Pill>
                  </div>
                  <p style={{ color: "var(--muted)", marginTop: 10 }}>{review.comment}</p>
                  {review.evidence.length > 0 ? <p style={{ color: "var(--accent-strong)" }}>Prova enviada: {review.evidence[0]?.note}</p> : null}
                </InfoCard>
              )) : <p style={{ color: "var(--muted)" }}>As reviews aprovadas deste negocio serao exibidas aqui.</p>}
            </div>
          </Surface>
        </div>
      </main>
    );
  } catch {
    notFound();
  }
}