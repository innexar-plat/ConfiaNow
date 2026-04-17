import Link from "next/link";
import { getAdminAnalyticsFunnels, getAdminAnalyticsOverview } from "@platform/analytics";
import { Eyebrow, InfoCard, Pill, Surface } from "../../../../../../packages/ui/src";
import { MetricsBarChart } from "../../../components/analytics/metrics-bar-chart";
import { requireDemoRole } from "../../../lib/session";

export default async function AdminAnalyticsPage({
  searchParams
}: {
  searchParams: Promise<{ from?: string; to?: string; days?: string }>;
}) {
  await requireDemoRole(["admin"]);
  const filters = await searchParams;
  const analyticsFilters = {
    from: filters.from,
    to: filters.to,
    days: filters.days ? Number(filters.days) : undefined
  };
  const [overview, funnels] = await Promise.all([
    getAdminAnalyticsOverview(analyticsFilters),
    getAdminAnalyticsFunnels(analyticsFilters)
  ]);

  return (
    <main style={{ minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 20 }}>
        <Surface>
          <Eyebrow>Admin analytics</Eyebrow>
          <h1 style={{ margin: "12px 0" }}>Visao operacional da plataforma</h1>
          <p style={{ color: "var(--muted)", maxWidth: 760 }}>
            Acompanhe aquisicao, conversao, moderacao, reputacao e pressao operacional sem depender de ferramenta externa nesta fase.
          </p>

          <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Pill>{overview.totals.newClientsCount} novos clientes</Pill>
            <Pill>{overview.totals.newBusinessesCount} novos negocios</Pill>
            <Pill>{overview.totals.activeProfilesCount} perfis publicados</Pill>
            <Pill>{overview.totals.openReportsCount} reports abertos</Pill>
          </div>

          <div style={{ marginTop: 18, display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Link href="/admin/settings">Voltar ao admin core</Link>
            <Link href="/dashboard">Ir para area protegida</Link>
          </div>
        </Surface>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <InfoCard><strong>{overview.totals.verifiedActiveBusinessesCount}</strong><p style={{ color: "var(--muted)" }}>Negocios verificados ativos</p></InfoCard>
          <InfoCard><strong>{overview.totals.averageResponseHours ?? 0}h</strong><p style={{ color: "var(--muted)" }}>Resposta media aos leads</p></InfoCard>
          <InfoCard><strong>{overview.totals.approvedReviewsCount}</strong><p style={{ color: "var(--muted)" }}>Reviews aprovadas</p></InfoCard>
          <InfoCard><strong>{overview.totals.averageReviewModerationHours ?? 0}h</strong><p style={{ color: "var(--muted)" }}>Moderacao media</p></InfoCard>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          <Surface>
            <MetricsBarChart
              title="Aquisicao diaria"
              series={overview.series.map((item) => ({ label: item.date.slice(5), value: item.newBusinessesCount + item.newClientsCount }))}
            />
          </Surface>

          <Surface>
            <MetricsBarChart
              title="Leads e reviews aprovadas"
              color="linear-gradient(180deg, #2f5b44 0%, #183227 100%)"
              series={overview.series.map((item) => ({ label: item.date.slice(5), value: item.leadsCreatedCount + item.approvedReviewsCount }))}
            />
          </Surface>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          <Surface>
            <Eyebrow>Funnel observado</Eyebrow>
            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              {funnels.steps.map((step) => (
                <InfoCard key={step.code}>
                  <strong>{step.label}</strong>
                  <p style={{ color: "var(--muted)" }}>{step.count} evento(s)</p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                    <Pill>prev {step.conversionFromPrevious ?? 0}%</Pill>
                    <Pill>base {step.conversionFromFirst ?? 0}%</Pill>
                  </div>
                </InfoCard>
              ))}
            </div>
          </Surface>

          <Surface>
            <Eyebrow>Demanda por regiao</Eyebrow>
            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              {overview.topDemandByRegion.length > 0 ? overview.topDemandByRegion.map((item, index) => (
                <InfoCard key={`${item.citySlug}-${item.categorySlug}-${index}`}>
                  <strong>{item.categorySlug ?? "sem categoria"}</strong>
                  <p style={{ color: "var(--muted)" }}>{item.citySlug ?? "sem cidade"}</p>
                  <div style={{ marginTop: 10 }}><Pill>{item.searchesCount} buscas</Pill></div>
                </InfoCard>
              )) : <p style={{ color: "var(--muted)" }}>Sem volume suficiente de buscas agregadas neste momento.</p>}
            </div>
          </Surface>
        </section>
      </div>
    </main>
  );
}
