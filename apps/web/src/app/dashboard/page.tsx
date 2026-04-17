import Link from "next/link";
import {
  getClientDashboardOverview,
  listClientDashboardFavorites,
  listClientDashboardHistory,
  listClientPendingReviews,
  listClientReportTimeline
} from "@platform/client-dashboard";
import {
  getProviderDashboardOverview,
  getProviderDashboardPerformance,
  listProviderDashboardPendingActions,
  listProviderDashboardRecommendations
} from "@platform/provider-dashboard";
import { Eyebrow, InfoCard, Pill, Surface } from "../../../../../packages/ui/src";
import { requireDemoRole } from "../../lib/session";

const capabilities: Record<"client" | "business" | "admin", string[]> = {
  client: ["enviar leads", "avaliar negocios", "salvar favoritos"],
  business: ["responder leads", "gerir perfil", "acompanhar selo"],
  admin: ["revisar configuracoes", "auditar eventos", "moderar operacao"]
};

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireDemoRole();
  const effectiveRole = session.role;
  const query = await searchParams;

  if (effectiveRole === "client" && session.id) {
    const [overview, favorites, history, pendingReviews, reports] = await Promise.all([
      getClientDashboardOverview(session.id),
      listClientDashboardFavorites(session.id),
      listClientDashboardHistory(session.id),
      listClientPendingReviews(session.id),
      listClientReportTimeline(session.id)
    ]);

    return (
      <main style={{ minHeight: "100vh", padding: 24 }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 20 }}>
          <Surface>
            <Eyebrow>Client dashboard</Eyebrow>
            <h1 style={{ margin: "12px 0" }}>Painel do cliente</h1>
            <p style={{ color: "var(--muted)", maxWidth: 780 }}>
              Acompanhe contatos, negocios salvos, reviews pendentes e denuncias abertas sem sair da area protegida.
            </p>

            <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
              {session.displayName ? <Pill>{session.displayName}</Pill> : null}
              <Pill>{overview.favoritesCount} favorito(s)</Pill>
              <Pill>{overview.pendingReviewsCount} review(s) pendente(s)</Pill>
              <Pill>{overview.openReportsCount} denuncia(s) aberta(s)</Pill>
            </div>

            {query.favoritesUpdated ? <p style={{ color: "var(--accent-strong)", marginTop: 14 }}>Favoritos atualizados com sucesso.</p> : null}
            {query.reportCreated ? <p style={{ color: "var(--accent-strong)", marginTop: 14 }}>Denuncia registrada e enviada para moderacao.</p> : null}
            {query.error ? <p style={{ color: "#8f3d1d", marginTop: 14 }}>Nao foi possivel concluir a operacao solicitada.</p> : null}
          </Surface>

          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <InfoCard><strong>{overview.historyCount}</strong><p style={{ color: "var(--muted)" }}>Contatos no historico</p></InfoCard>
            <InfoCard><strong>{overview.favoritesCount}</strong><p style={{ color: "var(--muted)" }}>Negocios salvos</p></InfoCard>
            <InfoCard><strong>{overview.pendingReviewsCount}</strong><p style={{ color: "var(--muted)" }}>Reviews prontas para envio</p></InfoCard>
            <InfoCard><strong>{overview.openReportsCount}</strong><p style={{ color: "var(--muted)" }}>Denuncias em andamento</p></InfoCard>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <Surface>
              <Eyebrow>Atalhos</Eyebrow>
              <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                <Link href="/dashboard/leads">Abrir historico completo</Link>
                <Link href="/dashboard/notifications">Abrir central de notificacoes</Link>
                <Link href="/trust/badges">Entender criterios de confianca</Link>
                <Link href="/signin">Trocar perfil</Link>
              </div>
            </Surface>

            <Surface>
              <Eyebrow>Atividade recente</Eyebrow>
              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                <InfoCard>
                  <strong>Ultima atividade</strong>
                  <p style={{ color: "var(--muted)" }}>{overview.lastActivityAt ? new Date(overview.lastActivityAt).toLocaleString("pt-BR") : "Nenhuma atividade ainda."}</p>
                </InfoCard>
                <InfoCard>
                  <strong>Recontato</strong>
                  <p style={{ color: "var(--muted)" }}>{history.filter((item) => item.canRecontact).length} lead(s) ja liberaram contato para continuidade fora da plataforma.</p>
                </InfoCard>
              </div>
            </Surface>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <Surface>
              <Eyebrow>Favoritos</Eyebrow>
              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {favorites.length > 0 ? favorites.map((favorite) => (
                  <InfoCard key={favorite.businessProfileId}>
                    <strong>{favorite.businessName}</strong>
                    <p style={{ color: "var(--muted)" }}>{favorite.headline ?? "Sem headline publica."}</p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                      {favorite.city || favorite.state ? <Pill>{[favorite.city, favorite.state].filter(Boolean).join(" / ")}</Pill> : null}
                      {favorite.trust ? <Pill>{favorite.trust.badgeLabel ?? "Sem selo"} {favorite.trust.score}</Pill> : null}
                    </div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
                      <Link href={`/businesses/${favorite.slug}`}>Abrir negocio</Link>
                      <form action={`/auth/client-dashboard/favorites/${favorite.businessProfileId}`} method="post">
                        <input type="hidden" name="actionType" value="remove" />
                        <button type="submit" style={{ border: 0, background: "transparent", color: "#7f3c20", cursor: "pointer", padding: 0 }}>Remover</button>
                      </form>
                    </div>
                  </InfoCard>
                )) : <p style={{ color: "var(--muted)" }}>Nenhum negocio salvo ainda. Voce pode favoritar a partir do historico abaixo.</p>}
              </div>
            </Surface>

            <Surface>
              <Eyebrow>Reviews pendentes</Eyebrow>
              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {pendingReviews.length > 0 ? pendingReviews.map((item) => (
                  <InfoCard key={item.leadId}>
                    <strong>{item.businessName}</strong>
                    <p style={{ color: "var(--muted)" }}>{item.subject}</p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                      <Pill>contato liberado</Pill>
                      {item.isFavorited ? <Pill>favorito</Pill> : null}
                    </div>
                    <div style={{ marginTop: 12 }}><Link href={`/dashboard/leads/${item.leadId}`}>Abrir lead para avaliar</Link></div>
                  </InfoCard>
                )) : <p style={{ color: "var(--muted)" }}>Nenhuma review pendente no momento.</p>}
              </div>
            </Surface>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <Surface>
              <Eyebrow>Historico recente</Eyebrow>
              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {history.length > 0 ? history.slice(0, 6).map((item) => (
                  <InfoCard key={item.leadId}>
                    <strong>{item.subject}</strong>
                    <p style={{ color: "var(--muted)" }}>{item.businessName}</p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                      <Pill>{item.status}</Pill>
                      {item.canRecontact ? <Pill>recontato liberado</Pill> : null}
                      {item.isFavorited ? <Pill>favorito</Pill> : null}
                    </div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
                      <Link href={`/dashboard/leads/${item.leadId}`}>Abrir lead</Link>
                      {!item.isFavorited ? (
                        <form action={`/auth/client-dashboard/favorites/${item.businessProfileId}`} method="post">
                          <button type="submit" style={{ border: 0, background: "transparent", color: "var(--accent-strong)", cursor: "pointer", padding: 0 }}>Favoritar negocio</button>
                        </form>
                      ) : null}
                    </div>
                    <form action="/auth/client-dashboard/reports" method="post" style={{ display: "grid", gap: 8, marginTop: 12 }}>
                      <input type="hidden" name="type" value="REPORT_BUSINESS" />
                      <input type="hidden" name="targetType" value="business_profile" />
                      <input type="hidden" name="targetId" value={item.businessProfileId} />
                      <textarea name="description" placeholder="Descreva o problema para suporte e moderacao" rows={3} required style={{ padding: 10, borderRadius: 12, border: "1px solid var(--line)" }} />
                      <button type="submit" style={{ border: 0, borderRadius: 999, padding: "10px 14px", background: "#1d1a16", color: "#fff", cursor: "pointer" }}>Reportar negocio</button>
                    </form>
                  </InfoCard>
                )) : <p style={{ color: "var(--muted)" }}>Voce ainda nao iniciou contatos com negocios.</p>}
              </div>
            </Surface>

            <Surface>
              <Eyebrow>Suporte e denuncias</Eyebrow>
              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {reports.length > 0 ? reports.map((report) => (
                  <InfoCard key={report.id}>
                    <strong>{report.type}</strong>
                    <p style={{ color: "var(--muted)" }}>{report.description}</p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                      <Pill>{report.status}</Pill>
                      <Pill>{report.targetType}</Pill>
                    </div>
                  </InfoCard>
                )) : <p style={{ color: "var(--muted)" }}>Nenhuma denuncia aberta. Use o historico para acionar suporte quando necessario.</p>}
              </div>
            </Surface>
          </section>
        </div>
      </main>
    );
  }

  if (effectiveRole === "business" && session.id) {
    const [overview, performance, recommendations, pendingActions] = await Promise.all([
      getProviderDashboardOverview(session.id),
      getProviderDashboardPerformance(session.id),
      listProviderDashboardRecommendations(session.id),
      listProviderDashboardPendingActions(session.id)
    ]);

    return (
      <main style={{ minHeight: "100vh", padding: 24 }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 20 }}>
          <Surface>
            <Eyebrow>Provider dashboard</Eyebrow>
            <h1 style={{ margin: "12px 0" }}>Visao operacional do negocio</h1>
            <p style={{ color: "var(--muted)", maxWidth: 780 }}>
              Este painel consolida leads, trust, perfil publicado e recomendacoes acionaveis para o negocio evoluir no catalogo.
            </p>

            <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Pill>{overview.businessName}</Pill>
              <Pill>Selo {overview.badge.label}</Pill>
              <Pill>Trust {overview.badge.score}</Pill>
              <Pill>Assinatura {overview.subscriptionStatus}</Pill>
              {!overview.isProfilePublished ? <Pill>perfil nao publicado</Pill> : null}
            </div>
          </Surface>

          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <InfoCard><strong>{overview.kpis.openLeadsCount}</strong><p style={{ color: "var(--muted)" }}>Leads abertos</p></InfoCard>
            <InfoCard><strong>{overview.kpis.lateLeadsCount}</strong><p style={{ color: "var(--muted)" }}>Leads fora do SLA</p></InfoCard>
            <InfoCard><strong>{overview.kpis.approvedReviewsCount}</strong><p style={{ color: "var(--muted)" }}>Reviews aprovadas</p></InfoCard>
            <InfoCard><strong>{overview.pendingActionsCount}</strong><p style={{ color: "var(--muted)" }}>Pendencias imediatas</p></InfoCard>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <Surface>
              <Eyebrow>Atalhos</Eyebrow>
              <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                <Link href="/dashboard/business-profile">Gerir perfil publico</Link>
                <Link href="/dashboard/analytics">Abrir analytics do negocio</Link>
                <Link href="/dashboard/billing">Abrir billing e planos</Link>
                <Link href="/dashboard/leads/inbox">Abrir inbox de leads</Link>
                <Link href="/dashboard/notifications">Abrir central de notificacoes</Link>
                <Link href={`/businesses/${overview.businessSlug}`}>Ver perfil publico</Link>
                <Link href="/trust/badges">Entender o selo</Link>
              </div>
            </Surface>

            <Surface>
              <Eyebrow>Performance</Eyebrow>
              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                <InfoCard>
                  <strong>Taxa de resposta</strong>
                  <p style={{ color: "var(--muted)" }}>{overview.kpis.responseRate ?? 0}% dos leads com resposta registrada.</p>
                </InfoCard>
                <InfoCard>
                  <strong>Snapshots recentes</strong>
                  <p style={{ color: "var(--muted)" }}>{performance.recentSnapshots.length} snapshot(s) disponiveis para acompanhamento curto.</p>
                </InfoCard>
              </div>
            </Surface>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <Surface>
              <Eyebrow>Pendencias operacionais</Eyebrow>
              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {pendingActions.length > 0 ? pendingActions.map((action) => (
                  <InfoCard key={action.code}>
                    <strong>{action.title}</strong>
                    <p style={{ color: "var(--muted)" }}>{action.description}</p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                      <Pill>{action.priority}</Pill>
                      <Link href={action.href}>Abrir</Link>
                    </div>
                  </InfoCard>
                )) : <p style={{ color: "var(--muted)" }}>Nenhuma pendencia imediata.</p>}
              </div>
            </Surface>

            <Surface>
              <Eyebrow>Recomendacoes</Eyebrow>
              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {recommendations.length > 0 ? recommendations.map((item) => (
                  <InfoCard key={item.code}>
                    <strong>{item.title}</strong>
                    <p style={{ color: "var(--muted)" }}>{item.description}</p>
                    <div style={{ marginTop: 10 }}><Pill>{item.priority}</Pill></div>
                  </InfoCard>
                )) : <p style={{ color: "var(--muted)" }}>Nenhuma recomendacao ativa.</p>}
              </div>
            </Surface>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", padding: 24 }}>
      <Surface style={{ maxWidth: 980, margin: "0 auto" }}>
        <Eyebrow>Area protegida demo</Eyebrow>
        <h1 style={{ margin: "12px 0" }}>Dashboard inicial do Core Platform</h1>
        <p style={{ color: "var(--muted)", maxWidth: 720 }}>
          Esta rota agora aceita sessao real do modulo 01 e mantém o acesso demo apenas como fallback temporario.
        </p>

        <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Pill>Papel atual: {effectiveRole}</Pill>
          {session.displayName ? <Pill>{session.displayName}</Pill> : null}
          {session.verificationStatus ? <Pill>Status: {session.verificationStatus}</Pill> : null}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 24 }}>
          {capabilities[effectiveRole].map((item) => (
            <InfoCard key={item}>{item}</InfoCard>
          ))}
        </div>

        <div style={{ marginTop: 24, display: "flex", gap: 16, flexWrap: "wrap" }}>
          {effectiveRole === "admin" ? <Link href="/admin/settings">Abrir settings administrativos</Link> : null}
          {effectiveRole === "admin" ? <Link href="/admin/analytics">Abrir analytics administrativos</Link> : null}
          {session.id ? <Link href="/dashboard/notifications">Abrir central de notificacoes</Link> : null}
          {session.id ? <Link href="/verification">Abrir verificacao</Link> : null}
          {effectiveRole === "business" ? <Link href="/dashboard/business-profile">Gerir perfil publico</Link> : null}
          {effectiveRole === "business" ? <Link href="/dashboard/analytics">Abrir analytics do negocio</Link> : null}
          {effectiveRole === "business" ? <Link href="/dashboard/billing">Abrir billing e planos</Link> : null}
          {effectiveRole === "business" ? <Link href="/dashboard/leads/inbox">Abrir inbox de leads</Link> : null}
          <Link href="/trust/badges">Como funciona o selo</Link>
          {effectiveRole === "client" ? <Link href="/dashboard/leads">Ver meus leads</Link> : null}
          <Link href="/signin">Voltar para perfis demo</Link>
          <Link href="/auth/logout">Encerrar sessao demo</Link>
        </div>
      </Surface>
    </main>
  );
}

