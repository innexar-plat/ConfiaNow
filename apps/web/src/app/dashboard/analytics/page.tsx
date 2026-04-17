import Link from "next/link";
import {
  getBusinessAnalyticsLeads,
  getBusinessAnalyticsOverview,
  getBusinessAnalyticsReputation
} from "@platform/analytics";
import { Eyebrow, InfoCard, Pill, Surface } from "../../../../../../packages/ui/src";
import { MetricsBarChart } from "../../../components/analytics/metrics-bar-chart";
import { requireDemoRole } from "../../../lib/session";

export default async function BusinessAnalyticsPage({
  searchParams
}: {
  searchParams: Promise<{ from?: string; to?: string; days?: string; error?: string }>;
}) {
  const session = await requireDemoRole(["business"]);
  const filters = await searchParams;
  const analyticsFilters = {
    from: filters.from,
    to: filters.to,
    days: filters.days ? Number(filters.days) : undefined
  };

  if (!session.id) {
    return (
      <main style={{ minHeight: "100vh", padding: 24 }}>
        <Surface style={{ maxWidth: 920, margin: "0 auto" }}>
          <Eyebrow>Business analytics</Eyebrow>
          <h1 style={{ margin: "12px 0" }}>Relatorios do negocio</h1>
          <p style={{ color: "var(--muted)" }}>Entre com uma conta business autenticada para carregar metricas reais do seu perfil.</p>
        </Surface>
      </main>
    );
  }

  const [overview, leads, reputation] = await Promise.all([
    getBusinessAnalyticsOverview(session.id, analyticsFilters),
    getBusinessAnalyticsLeads(session.id, analyticsFilters),
    getBusinessAnalyticsReputation(session.id, analyticsFilters)
  ]);

  const periodParams = new URLSearchParams();
  if (filters.from) periodParams.set("from", filters.from);
  if (filters.to) periodParams.set("to", filters.to);
  if (filters.days) periodParams.set("days", filters.days);
  const exportHref = `/auth/analytics/export${periodParams.toString() ? `?${periodParams.toString()}` : ""}`;

  return (
    <main style={{ minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 20 }}>
        <Surface>
          <Eyebrow>Business analytics</Eyebrow>
          <h1 style={{ margin: "12px 0" }}>Relatorio operacional do negocio</h1>
          <p style={{ color: "var(--muted)", maxWidth: 760 }}>
            Acompanhe conversao do perfil publico, velocidade de resposta, reputacao e comparativo com a media da plataforma no mesmo escopo.
          </p>

          <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Pill>{overview.businessName}</Pill>
            <Pill>{overview.summary.subscriptionStatus}</Pill>
            <Pill>{overview.summary.profileViewsCount} views</Pill>
            <Pill>{overview.summary.leadsReceivedCount} leads</Pill>
          </div>

          <div style={{ marginTop: 18, display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Link href="/dashboard">Voltar ao dashboard</Link>
            <Link href="/dashboard/business-profile">Editar perfil</Link>
            <Link href={exportHref}>Exportar CSV</Link>
          </div>

          {filters.error ? <p style={{ color: "#8f3d1d", marginTop: 16 }}>Nao foi possivel exportar o relatorio solicitado.</p> : null}
        </Surface>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <InfoCard><strong>{overview.summary.contactClicksCount}</strong><p style={{ color: "var(--muted)" }}>Cliques de contato</p></InfoCard>
          <InfoCard><strong>{overview.summary.responseRate}%</strong><p style={{ color: "var(--muted)" }}>Taxa de resposta</p></InfoCard>
          <InfoCard><strong>{overview.summary.averageResponseHours ?? 0}h</strong><p style={{ color: "var(--muted)" }}>Tempo medio de resposta</p></InfoCard>
          <InfoCard><strong>{overview.summary.trustScoreLatest}</strong><p style={{ color: "var(--muted)" }}>Trust score atual</p></InfoCard>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          <Surface>
            <MetricsBarChart
              title="Leads por dia"
              series={leads.daily.map((item) => ({ label: item.date.slice(5), value: item.leadsReceivedCount }))}
            />
          </Surface>

          <Surface>
            <MetricsBarChart
              title="Trust score diario"
              color="linear-gradient(180deg, #1d1a16 0%, #4f463e 100%)"
              series={reputation.daily.map((item) => ({ label: item.date.slice(5), value: item.trustScore }))}
            />
          </Surface>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          <Surface>
            <Eyebrow>Conversao</Eyebrow>
            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              <InfoCard><strong>{overview.summary.profileViewsCount}</strong><p style={{ color: "var(--muted)" }}>Visualizacoes do perfil</p></InfoCard>
              <InfoCard><strong>{overview.summary.contactClicksCount}</strong><p style={{ color: "var(--muted)" }}>Cliques em contato</p></InfoCard>
              <InfoCard><strong>{overview.summary.leadsReceivedCount}</strong><p style={{ color: "var(--muted)" }}>Leads recebidos</p></InfoCard>
            </div>
          </Surface>

          <Surface>
            <Eyebrow>Reputacao</Eyebrow>
            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              <InfoCard><strong>{reputation.summary.approvedReviewsCount}</strong><p style={{ color: "var(--muted)" }}>Reviews aprovadas no periodo</p></InfoCard>
              <InfoCard><strong>{reputation.summary.averageRating ?? 0}</strong><p style={{ color: "var(--muted)" }}>Media propria</p></InfoCard>
              <InfoCard><strong>{reputation.summary.platformAverageRating ?? 0}</strong><p style={{ color: "var(--muted)" }}>Media da plataforma comparavel</p></InfoCard>
            </div>
          </Surface>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          <Surface>
            <Eyebrow>Demandas recorrentes</Eyebrow>
            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {overview.summary.demandHighlights.length > 0 ? overview.summary.demandHighlights.map((item) => (
                <Pill key={item}>{item}</Pill>
              )) : <p style={{ color: "var(--muted)" }}>Ainda nao ha volume suficiente para destacar temas de procura.</p>}
            </div>
          </Surface>

          <Surface>
            <Eyebrow>Top assuntos de lead</Eyebrow>
            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              {leads.topSubjects.length > 0 ? leads.topSubjects.map((item) => (
                <InfoCard key={item.term}><strong>{item.term}</strong><p style={{ color: "var(--muted)" }}>{item.count} lead(s) relacionados</p></InfoCard>
              )) : <p style={{ color: "var(--muted)" }}>Sem assuntos suficientes para ranking neste periodo.</p>}
            </div>
          </Surface>
        </section>
      </div>
    </main>
  );
}
