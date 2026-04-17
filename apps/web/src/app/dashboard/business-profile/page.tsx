import Link from "next/link";
import { getOwnBusinessProfile } from "@platform/profiles";
import { getBusinessBadgeStatus } from "@platform/trust";
import { Eyebrow, InfoCard, Pill, Surface } from "../../../../../../packages/ui/src";
import { requireDemoRole } from "../../../lib/session";

export default async function BusinessProfileDashboardPage({
  searchParams
}: {
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const session = await requireDemoRole(["business"]);
  const params = await searchParams;

  if (!session.id) {
    return (
      <main style={{ minHeight: "100vh", padding: 24 }}>
        <Surface style={{ maxWidth: 860, margin: "0 auto" }}>
          <Eyebrow>Perfil do negocio</Eyebrow>
          <h1 style={{ margin: "12px 0" }}>Edicao real indisponivel na sessao demo</h1>
          <p style={{ color: "var(--muted)" }}>Use uma conta de negocio criada no fluxo real para publicar perfil, servicos e portfolio.</p>
        </Surface>
      </main>
    );
  }

  const business = await getOwnBusinessProfile(session.id);
  const trustStatus = await getBusinessBadgeStatus(session.id);

  return (
    <main style={{ minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 20 }}>
        <Surface>
          <Eyebrow>Painel do negocio</Eyebrow>
          <h1 style={{ margin: "12px 0" }}>Perfil publico e catalogo</h1>
          <p style={{ color: "var(--muted)", maxWidth: 780 }}>
            Esta etapa do modulo 02 publica o perfil do negocio por slug e permite editar perfil comercial, servicos e portfolio em banco real.
          </p>

          <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Pill>Slug: {business.profile.slug}</Pill>
            <Pill>Publicacao: {business.profile.categories.length >= 0 ? (business.profile.slug ? "configurado" : "pendente") : "pendente"}</Pill>
            <Pill>Selo: {trustStatus.badgeLabel}</Pill>
            <Pill>Trust: {trustStatus.score}</Pill>
            <Link href={`/businesses/${business.profile.slug}`}>Abrir perfil publico</Link>
            <Link href="/dashboard/billing">Planos e billing</Link>
            <Link href="/trust/badges">Entender o selo</Link>
          </div>

          {params.updated ? <p style={{ color: "var(--accent-strong)" }}>Alteracoes salvas com sucesso.</p> : null}
          {params.error ? <p style={{ color: "#8f3d1d" }}>Nao foi possivel concluir a operacao solicitada.</p> : null}
        </Surface>

        <Surface>
          <Eyebrow>Status do selo</Eyebrow>
          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            <InfoCard>
              <strong>{trustStatus.badgeLabel}</strong>
              <p style={{ color: "var(--muted)" }}>Score atual {trustStatus.score}. Leads respondidos: {trustStatus.respondedLeadCount}/{trustStatus.totalLeadCount}.</p>
              {trustStatus.isSuspended ? <p style={{ color: "#8f3d1d" }}>Badge suspenso: {trustStatus.suspensionReason ?? "motivo nao informado"}</p> : null}
            </InfoCard>

            <InfoCard>
              <strong>Componentes do score</strong>
              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Pill>Verificacao {trustStatus.componentBreakdown.verification}</Pill>
                <Pill>Perfil {trustStatus.componentBreakdown.profile}</Pill>
                <Pill>Servicos {trustStatus.componentBreakdown.services}</Pill>
                <Pill>Portfolio {trustStatus.componentBreakdown.portfolio}</Pill>
                <Pill>Leads {trustStatus.componentBreakdown.leadResponse}</Pill>
              </div>
            </InfoCard>

            <InfoCard>
              <strong>Pendencias para evoluir</strong>
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {trustStatus.pendingItems.length > 0 ? trustStatus.pendingItems.map((item) => <p key={item} style={{ color: "var(--muted)" }}>{item}</p>) : <p style={{ color: "var(--muted)" }}>Nenhuma pendencia operacional imediata.</p>}
              </div>
            </InfoCard>
          </div>
        </Surface>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          <Surface>
            <Eyebrow>Perfil comercial</Eyebrow>
            <form action="/auth/business-profile" method="post" style={{ display: "grid", gap: 10, marginTop: 16 }}>
              <input name="businessName" defaultValue={business.profile.businessName} placeholder="Nome do negocio" required style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
              <input name="headline" defaultValue={business.profile.headline ?? ""} placeholder="Headline publica" style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
              <textarea name="description" defaultValue={business.profile.description ?? ""} placeholder="Descricao publica" rows={5} style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
              <input name="publicEmail" defaultValue={business.profile.publicEmail ?? session.email ?? ""} placeholder="E-mail publico" style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
              <input name="publicPhone" defaultValue={business.profile.publicPhone ?? ""} placeholder="Telefone publico" style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
              <input name="whatsapp" defaultValue={business.profile.whatsapp ?? ""} placeholder="WhatsApp" style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
              <input name="websiteUrl" defaultValue={business.profile.websiteUrl ?? ""} placeholder="Website" style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
              <input name="city" defaultValue={business.profile.city ?? ""} placeholder="Cidade" style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
              <input name="state" defaultValue={business.profile.state ?? ""} placeholder="Estado" style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
              <input name="serviceArea" defaultValue={business.profile.serviceArea ?? ""} placeholder="Area de atendimento" style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
              <input name="yearsInBusiness" type="number" defaultValue={business.profile.yearsInBusiness ?? 0} placeholder="Anos de experiencia" style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
              <input name="categories" defaultValue={business.profile.categories.map((category) => category.name).join(", ")} placeholder="Categorias separadas por virgula" style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />

              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input name="isPublished" type="checkbox" value="true" defaultChecked />
                Publicar perfil no catalogo publico
              </label>

              <button type="submit" style={{ border: 0, borderRadius: 999, padding: "12px 16px", background: "var(--accent)", color: "#fff", cursor: "pointer" }}>
                Salvar perfil
              </button>
            </form>
          </Surface>

          <Surface>
            <Eyebrow>Servicos</Eyebrow>
            <form action="/auth/business-services" method="post" style={{ display: "grid", gap: 10, marginTop: 16 }}>
              <input name="title" placeholder="Titulo do servico" required style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
              <textarea name="description" placeholder="Descricao do servico" rows={3} style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
              <input name="priceLabel" placeholder="Faixa de preco" style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
              <button type="submit" style={{ border: 0, borderRadius: 999, padding: "12px 16px", background: "#1d1a16", color: "#fff", cursor: "pointer" }}>
                Adicionar servico
              </button>
            </form>

            <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
              {business.services.length > 0 ? business.services.map((service) => (
                <InfoCard key={service.id}>
                  <form action={`/auth/business-services/${service.id}`} method="post" style={{ display: "grid", gap: 8 }}>
                    <input type="hidden" name="actionType" value="update" />
                    <input name="title" defaultValue={service.title} required style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
                    <textarea name="description" defaultValue={service.description ?? ""} rows={3} style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
                    <input name="priceLabel" defaultValue={service.priceLabel ?? ""} style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button type="submit" style={{ border: 0, borderRadius: 999, padding: "10px 14px", background: "var(--accent)", color: "#fff", cursor: "pointer" }}>
                        Atualizar
                      </button>
                      <button type="submit" name="actionType" value="delete" style={{ border: 0, borderRadius: 999, padding: "10px 14px", background: "#efe3db", color: "#7f3c20", cursor: "pointer" }}>
                        Remover
                      </button>
                    </div>
                  </form>
                </InfoCard>
              )) : <p style={{ color: "var(--muted)" }}>Nenhum servico cadastrado ainda.</p>}
            </div>
          </Surface>
        </section>

        <Surface>
          <Eyebrow>Portfolio</Eyebrow>
          <form action="/auth/business-portfolio" method="post" style={{ display: "grid", gap: 10, marginTop: 16, maxWidth: 560 }}>
            <input name="title" placeholder="Titulo do projeto" required style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
            <textarea name="description" placeholder="Descricao do projeto" rows={3} style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
            <input name="mediaUrl" placeholder="URL ou referencia da midia" style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
            <button type="submit" style={{ border: 0, borderRadius: 999, padding: "12px 16px", background: "#1d1a16", color: "#fff", cursor: "pointer" }}>
              Adicionar item ao portfolio
            </button>
          </form>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginTop: 18 }}>
            {business.portfolioItems.length > 0 ? business.portfolioItems.map((item) => (
              <InfoCard key={item.id}>
                <form action={`/auth/business-portfolio/${item.id}`} method="post" style={{ display: "grid", gap: 8 }}>
                  <input type="hidden" name="actionType" value="update" />
                  <input name="title" defaultValue={item.title} required style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
                  <textarea name="description" defaultValue={item.description ?? ""} rows={3} style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
                  <input name="mediaUrl" defaultValue={item.mediaUrl ?? ""} style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button type="submit" style={{ border: 0, borderRadius: 999, padding: "10px 14px", background: "var(--accent)", color: "#fff", cursor: "pointer" }}>
                      Atualizar
                    </button>
                    <button type="submit" name="actionType" value="delete" style={{ border: 0, borderRadius: 999, padding: "10px 14px", background: "#efe3db", color: "#7f3c20", cursor: "pointer" }}>
                      Remover
                    </button>
                  </div>
                </form>
              </InfoCard>
            )) : <p style={{ color: "var(--muted)" }}>Nenhum item de portfolio cadastrado ainda.</p>}
          </div>
        </Surface>
      </div>
    </main>
  );
}