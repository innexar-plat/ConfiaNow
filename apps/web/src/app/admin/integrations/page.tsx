import Link from "next/link";
import { BackgroundJobStatus, IntegrationProvider } from "@prisma/client";
import { getIntegrationsStatus, listBackgroundJobs } from "@platform/integrations";
import { Eyebrow, InfoCard, Pill, Surface } from "../../../../../../packages/ui/src";
import { IntegrationStatusCards } from "../../../components/integrations/integration-status-cards";
import { requireDemoRole } from "../../../lib/session";

export default async function AdminIntegrationsPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string; provider?: string; status?: string }>;
}) {
  await requireDemoRole(["admin"]);
  const params = await searchParams;

  const [statusSummary, jobs] = await Promise.all([
    getIntegrationsStatus(),
    listBackgroundJobs({
      page: params.page ? Number(params.page) : 1,
      limit: 20,
      provider: params.provider as IntegrationProvider | undefined,
      status: params.status as BackgroundJobStatus | undefined
    })
  ]);

  return (
    <main style={{ minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", display: "grid", gap: 20 }}>
        <Surface>
          <Eyebrow>Admin - Integrations</Eyebrow>
          <h1 style={{ margin: "12px 0" }}>Integracoes e automacoes</h1>
          <p style={{ color: "var(--muted)", maxWidth: 760 }}>
            Monitore eventos de provedores, status da fila de jobs e execute retentativas operacionais quando necessario.
          </p>
          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Pill>{statusSummary.meta.providerCount} provedores monitorados</Pill>
            <Pill>{jobs.meta.total} jobs encontrados</Pill>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
            <Link href="/admin/settings">← Voltar ao admin</Link>
            <Link href="/admin/analytics">Analytics</Link>
          </div>
        </Surface>

        <Surface>
          <Eyebrow>Status por provedor</Eyebrow>
          <div style={{ marginTop: 14 }}>
            <IntegrationStatusCards items={statusSummary.data} />
          </div>
        </Surface>

        <Surface>
          <Eyebrow>Fila de jobs</Eyebrow>
          <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/admin/integrations">Todos</Link>
            <Link href="/admin/integrations?provider=VERIFICATION_PROVIDER">Verification</Link>
            <Link href="/admin/integrations?provider=EMAIL_PROVIDER">Email</Link>
            <Link href="/admin/integrations?provider=STORAGE_PROVIDER">Storage</Link>
            <span style={{ color: "var(--muted)" }}>|</span>
            <Link href="/admin/integrations?status=PENDING">Pending</Link>
            <Link href="/admin/integrations?status=RUNNING">Running</Link>
            <Link href="/admin/integrations?status=FAILED">Failed</Link>
          </div>

          {jobs.data.length === 0 ? (
            <p style={{ color: "var(--muted)", marginTop: 16 }}>Nenhum job encontrado para os filtros atuais.</p>
          ) : (
            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              {jobs.data.map((job) => (
                <InfoCard key={job.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <div>
                      <strong>{job.jobType}</strong>
                      <p style={{ color: "var(--muted)", fontSize: 13 }}>{job.id}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {job.provider ? <Pill>{job.provider}</Pill> : null}
                      <Pill>{job.status}</Pill>
                      <Pill>Tentativas {job.attemptCount}/{job.maxAttempts}</Pill>
                    </div>
                  </div>

                  {job.lastError ? (
                    <p style={{ color: "#8f3d1d", marginTop: 10 }}>Ultimo erro: {job.lastError}</p>
                  ) : null}

                  {job.status === "FAILED" ? (
                    <form action={`/api/v1/admin/jobs/${job.id}/retry`} method="post" style={{ marginTop: 12 }}>
                      <button
                        type="submit"
                        style={{ border: 0, borderRadius: 999, padding: "10px 14px", background: "#1d1a16", color: "#fff", cursor: "pointer" }}
                      >
                        Retentar job
                      </button>
                    </form>
                  ) : null}
                </InfoCard>
              ))}
            </div>
          )}

          {jobs.meta.totalPages > 1 ? (
            <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
              {jobs.meta.page > 1 ? (
                <Link href={`/admin/integrations?page=${jobs.meta.page - 1}`}>← Anterior</Link>
              ) : null}
              <span style={{ color: "var(--muted)" }}>
                Pagina {jobs.meta.page} de {jobs.meta.totalPages}
              </span>
              {jobs.meta.page < jobs.meta.totalPages ? (
                <Link href={`/admin/integrations?page=${jobs.meta.page + 1}`}>Proxima →</Link>
              ) : null}
            </div>
          ) : null}
        </Surface>
      </div>
    </main>
  );
}
