import Link from "next/link";
import { listAdminPages } from "@platform/cms";
import { Eyebrow, InfoCard, Pill, Surface } from "../../../../../../packages/ui/src";
import { requireDemoRole } from "../../../lib/session";

export default async function AdminPagesPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string; type?: string; status?: string }>;
}) {
  await requireDemoRole(["admin"]);
  const params = await searchParams;

  const result = await listAdminPages({
    page: params.page ? Number(params.page) : 1,
    limit: 20,
    type: params.type as Parameters<typeof listAdminPages>[0]["type"],
    status: params.status as Parameters<typeof listAdminPages>[0]["status"]
  });

  return (
    <main style={{ minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 20 }}>
        <Surface>
          <Eyebrow>Admin — Growth CMS</Eyebrow>
          <h1 style={{ margin: "12px 0" }}>Gestao de paginas</h1>
          <p style={{ color: "var(--muted)", maxWidth: 760 }}>
            Crie e gerencie paginas CMS, landing pages de cidade, categoria e conteudo programatico de aquisicao.
          </p>
          <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Pill>{result.meta.total} paginas</Pill>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
            <Link href="/admin/settings">← Voltar ao admin</Link>
            <Link href="/admin/analytics">Analytics</Link>
          </div>
        </Surface>

        <Surface>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <Link href="/admin/pages">Todos</Link>
            <Link href="/admin/pages?type=CMS">CMS</Link>
            <Link href="/admin/pages?type=CITY">Cidades</Link>
            <Link href="/admin/pages?type=CATEGORY">Categorias</Link>
            <span style={{ color: "var(--muted)" }}>|</span>
            <Link href="/admin/pages?status=DRAFT">Rascunho</Link>
            <Link href="/admin/pages?status=PUBLISHED">Publicadas</Link>
            <Link href="/admin/pages?status=ARCHIVED">Arquivadas</Link>
          </div>

          {result.data.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>Nenhuma pagina encontrada com os filtros selecionados.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {result.data.map((page) => (
                <InfoCard key={page.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <strong>{page.title}</strong>
                      <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
                        /{page.slug}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Pill>{page.type}</Pill>
                      <Pill>{page.status}</Pill>
                      {page.publishedAt ? (
                        <Pill>Publicada {new Date(page.publishedAt).toLocaleDateString("pt-BR")}</Pill>
                      ) : null}
                    </div>
                  </div>
                </InfoCard>
              ))}
            </div>
          )}

          {result.meta.totalPages > 1 ? (
            <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
              {result.meta.page > 1 ? (
                <Link href={`/admin/pages?page=${result.meta.page - 1}`}>← Anterior</Link>
              ) : null}
              <span style={{ color: "var(--muted)" }}>
                Pagina {result.meta.page} de {result.meta.totalPages}
              </span>
              {result.meta.page < result.meta.totalPages ? (
                <Link href={`/admin/pages?page=${result.meta.page + 1}`}>Proxima →</Link>
              ) : null}
            </div>
          ) : null}
        </Surface>
      </div>
    </main>
  );
}
