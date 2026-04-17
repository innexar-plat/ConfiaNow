import { getVerificationStatusForAccount } from "@platform/auth";
import { Eyebrow, InfoCard, Pill, Surface } from "../../../../../packages/ui/src";
import { requireDemoRole } from "../../lib/session";

export default async function VerificationPage({
  searchParams
}: {
  searchParams: Promise<{ emailCode?: string; phoneCode?: string; error?: string; documentUploaded?: string; documentResubmitted?: string }>;
}) {
  const session = await requireDemoRole();
  const params = await searchParams;

  if (!session.id) {
    return (
      <main style={{ minHeight: "100vh", padding: 24 }}>
        <Surface style={{ maxWidth: 860, margin: "0 auto" }}>
          <Eyebrow>Verificacao</Eyebrow>
          <h1 style={{ margin: "12px 0" }}>Fluxo real indisponivel na sessao demo</h1>
          <p style={{ color: "var(--muted)" }}>Use uma conta criada nesta fase para acessar OTP, documentos e status persistido em banco.</p>
        </Surface>
      </main>
    );
  }

  const verification = await getVerificationStatusForAccount(session.id);

  return (
    <main style={{ minHeight: "100vh", padding: 24 }}>
      <Surface style={{ maxWidth: 980, margin: "0 auto" }}>
        <Eyebrow>Verificacao</Eyebrow>
        <h1 style={{ margin: "12px 0" }}>Status da verificacao</h1>
        <p style={{ color: "var(--muted)", maxWidth: 760 }}>
          Esta tela usa o fluxo real do modulo 01: OTP de contato, documentos e mudanca de status persistidos em PostgreSQL via Prisma.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
          <Pill>{verification.account.displayName}</Pill>
          <Pill>{verification.account.role}</Pill>
          <Pill>{verification.account.verificationStatus}</Pill>
        </div>

        {params.error ? <p style={{ color: "#8f3d1d" }}>Nao foi possivel concluir a acao solicitada.</p> : null}
        {params.documentUploaded ? <p style={{ color: "var(--muted)" }}>Documento registrado com sucesso.</p> : null}
        {params.documentResubmitted ? <p style={{ color: "var(--muted)" }}>Documento reenviado para nova analise.</p> : null}
        {params.emailCode ? <p style={{ color: "var(--muted)" }}>Codigo demo de e-mail: {params.emailCode}</p> : null}
        {params.phoneCode ? <p style={{ color: "var(--muted)" }}>Codigo demo de telefone: {params.phoneCode}</p> : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 24 }}>
          <InfoCard>
            <strong>E-mail</strong>
            <p style={{ color: "var(--muted)" }}>Verificado: {verification.account.emailVerified ? "sim" : "nao"}</p>
            <form action="/auth/verify/email/request" method="post" style={{ marginBottom: 12 }}>
              <button type="submit" style={{ border: 0, borderRadius: 999, padding: "10px 14px", background: "var(--accent)", color: "#fff", cursor: "pointer" }}>
                Enviar codigo de e-mail
              </button>
            </form>
            <form action="/auth/verify/email/confirm" method="post" style={{ display: "grid", gap: 8 }}>
              <input name="code" placeholder="Codigo de 6 digitos" required style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
              <button type="submit" style={{ border: 0, borderRadius: 999, padding: "10px 14px", background: "#1d1a16", color: "#fff", cursor: "pointer" }}>
                Confirmar e-mail
              </button>
            </form>
          </InfoCard>

          <InfoCard>
            <strong>Telefone</strong>
            <p style={{ color: "var(--muted)" }}>Verificado: {verification.account.phoneVerified ? "sim" : "nao"}</p>
            <form action="/auth/verify/phone/request" method="post" style={{ marginBottom: 12 }}>
              <button type="submit" style={{ border: 0, borderRadius: 999, padding: "10px 14px", background: "var(--accent)", color: "#fff", cursor: "pointer" }}>
                Enviar codigo de telefone
              </button>
            </form>
            <form action="/auth/verify/phone/confirm" method="post" style={{ display: "grid", gap: 8 }}>
              <input name="code" placeholder="Codigo de 6 digitos" required style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
              <button type="submit" style={{ border: 0, borderRadius: 999, padding: "10px 14px", background: "#1d1a16", color: "#fff", cursor: "pointer" }}>
                Confirmar telefone
              </button>
            </form>
          </InfoCard>

          <InfoCard>
            <strong>Documentos</strong>
            <p style={{ color: "var(--muted)" }}>Uploads enviados: {verification.documents.length}</p>
            <form action="/auth/documents" method="post" style={{ display: "grid", gap: 8 }}>
              <input name="documentType" placeholder="Tipo do documento" required style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
              <input name="fileName" placeholder="Nome do arquivo" required style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
              <button type="submit" style={{ border: 0, borderRadius: 999, padding: "10px 14px", background: "var(--accent)", color: "#fff", cursor: "pointer" }}>
                Registrar documento
              </button>
            </form>
            <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
              {verification.documents.map((document) => (
                <div key={document.id} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 12, display: "grid", gap: 8 }}>
                  <p style={{ margin: 0 }}><strong>{document.documentType}</strong></p>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>{document.fileName}</p>
                  <form action={`/auth/documents/${document.id}/resubmit`} method="post" style={{ display: "grid", gap: 8 }}>
                    <input name="originalName" placeholder="Novo nome de arquivo" required style={{ padding: 10, borderRadius: 10, border: "1px solid var(--line)" }} />
                    <input name="mimeType" placeholder="Mime type (ex: application/pdf)" required defaultValue="application/pdf" style={{ padding: 10, borderRadius: 10, border: "1px solid var(--line)" }} />
                    <input name="sizeBytes" type="number" min={1} max={10485760} required defaultValue={1024} style={{ padding: 10, borderRadius: 10, border: "1px solid var(--line)" }} />
                    <input name="storageUrl" placeholder="https://storage.local/file.pdf" required style={{ padding: 10, borderRadius: 10, border: "1px solid var(--line)" }} />
                    <input name="checksumSha256" placeholder="checksum opcional" style={{ padding: 10, borderRadius: 10, border: "1px solid var(--line)" }} />
                    <button type="submit" style={{ border: 0, borderRadius: 999, padding: "10px 14px", background: "#1d1a16", color: "#fff", cursor: "pointer" }}>
                      Reenviar documento
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </InfoCard>
        </div>
      </Surface>
    </main>
  );
}