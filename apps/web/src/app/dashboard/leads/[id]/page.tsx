import Link from "next/link";
import { UserRole } from "@prisma/client";
import { getLeadConversationMessages } from "@platform/communication";
import { getLeadDetailForUser } from "@platform/leads";
import { getLeadReviewEligibility } from "@platform/reviews";
import { Eyebrow, InfoCard, Pill, Surface } from "../../../../../../../packages/ui/src";
import { requireDemoRole } from "../../../../lib/session";

export default async function LeadDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; updated?: string; contactReleased?: string; reviewSubmitted?: string; reviewUpdated?: string; messageSent?: string; readUpdated?: string; error?: string }> }) {
  const session = await requireDemoRole(["client", "business", "admin"]);
  const { id } = await params;
  const query = await searchParams;

  if (!session.id) {
    return <main style={{ minHeight: "100vh", padding: 24 }}><Surface style={{ maxWidth: 860, margin: "0 auto" }}><Eyebrow>Lead</Eyebrow><p style={{ color: "var(--muted)" }}>Sessao real obrigatoria.</p></Surface></main>;
  }

  const lead = await getLeadDetailForUser(session.id, session.role.toUpperCase() as UserRole, id);
  const conversationMessages = await getLeadConversationMessages({ actorUserId: session.id, leadId: id });
  const reviewEligibility = session.role === "client" && session.id
    ? await getLeadReviewEligibility(session.id, id)
    : null;

  return (
    <main style={{ minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 20 }}>
        <Surface>
          <Eyebrow>Lead</Eyebrow>
          <h1 style={{ margin: "12px 0" }}>{lead.subject}</h1>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Pill>{lead.status}</Pill>
            <Pill>{lead.business.businessName}</Pill>
            <Link href={`/businesses/${lead.business.slug}`}>Abrir negocio</Link>
          </div>
          {query.created ? <p style={{ color: "var(--accent-strong)" }}>Lead criado com sucesso.</p> : null}
          {query.updated ? <p style={{ color: "var(--accent-strong)" }}>Lead atualizado com sucesso.</p> : null}
          {query.contactReleased ? <p style={{ color: "var(--accent-strong)" }}>Contato liberado para o cliente.</p> : null}
          {query.reviewSubmitted ? <p style={{ color: "var(--accent-strong)" }}>Review enviada para moderacao.</p> : null}
          {query.reviewUpdated ? <p style={{ color: "var(--accent-strong)" }}>Novas informacoes da review enviadas para revisao.</p> : null}
          {query.messageSent ? <p style={{ color: "var(--accent-strong)" }}>Mensagem enviada com sucesso.</p> : null}
          {query.readUpdated ? <p style={{ color: "var(--accent-strong)" }}>Conversa marcada como lida.</p> : null}
          {query.error ? <p style={{ color: "#8f3d1d" }}>Nao foi possivel concluir a operacao.</p> : null}
        </Surface>

        <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(320px, 0.9fr)", gap: 16 }}>
          <Surface>
            <Eyebrow>Mensagens do lead</Eyebrow>
            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              {lead.messages.map((message) => (
                <InfoCard key={message.id}>
                  <strong>{message.senderRole}</strong>
                  <p style={{ color: "var(--muted)" }}>{message.body}</p>
                </InfoCard>
              ))}
            </div>

            <div style={{ marginTop: 24 }}>
              <Eyebrow>Chat in-app</Eyebrow>
            </div>
            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              {conversationMessages.length > 0 ? conversationMessages.map((message) => (
                <InfoCard key={message.id}>
                  <strong>{message.senderRole}</strong>
                  <p style={{ color: "var(--muted)" }}>{message.body}</p>
                  {message.attachments.length > 0 ? (
                    <p style={{ color: "var(--accent-strong)" }}>
                      Anexo: {message.attachments[0]?.fileName}
                    </p>
                  ) : null}
                </InfoCard>
              )) : <p style={{ color: "var(--muted)" }}>Nenhuma mensagem de chat ainda. Envie a primeira mensagem para iniciar a conversa in-app.</p>}
            </div>

            {session.role === "client" || session.role === "business" ? (
              <form action={`/auth/conversations/${lead.id}/messages`} method="post" style={{ display: "grid", gap: 10, marginTop: 16 }}>
                <textarea name="body" placeholder="Escreva sua mensagem para esta conversa" rows={4} required style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
                <button type="submit" style={{ border: 0, borderRadius: 999, padding: "12px 16px", background: "#1d1a16", color: "#fff", cursor: "pointer" }}>Enviar mensagem</button>
              </form>
            ) : null}

            <form action={`/auth/conversations/${lead.id}/read`} method="post" style={{ marginTop: 10 }}>
              <button type="submit" style={{ border: "1px solid var(--line)", borderRadius: 999, padding: "10px 14px", background: "#fff", color: "#1d1a16", cursor: "pointer" }}>
                Marcar conversa como lida
              </button>
            </form>
          </Surface>

          <div style={{ display: "grid", gap: 16 }}>
            <Surface>
              <Eyebrow>Historico</Eyebrow>
              <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                {lead.statusHistory.map((item) => (
                  <InfoCard key={item.id}><strong>{item.toStatus}</strong>{item.note ? <p style={{ color: "var(--muted)" }}>{item.note}</p> : null}</InfoCard>
                ))}
              </div>
            </Surface>

            {session.role === "business" ? (
              <>
                <Surface>
                  <Eyebrow>Responder lead</Eyebrow>
                  <form action={`/auth/leads/${lead.id}/status`} method="post" style={{ display: "grid", gap: 10, marginTop: 16 }}>
                    <input type="hidden" name="status" value="responded" />
                    <textarea name="responseMessage" placeholder="Resposta inicial ao cliente" rows={4} required style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
                    <input name="note" placeholder="Nota interna opcional" style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
                    <button type="submit" style={{ border: 0, borderRadius: 999, padding: "12px 16px", background: "var(--accent)", color: "#fff", cursor: "pointer" }}>Responder</button>
                  </form>
                </Surface>

                <Surface>
                  <Eyebrow>Contato</Eyebrow>
                  <form action={`/auth/leads/${lead.id}/contact-release`} method="post" style={{ display: "grid", gap: 10, marginTop: 16 }}>
                    <input name="note" placeholder="Observacao da liberacao" style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
                    <button type="submit" style={{ border: 0, borderRadius: 999, padding: "12px 16px", background: "#1d1a16", color: "#fff", cursor: "pointer" }}>Liberar contato</button>
                  </form>
                  <form action={`/auth/leads/${lead.id}/status`} method="post" style={{ display: "grid", gap: 10, marginTop: 16 }}>
                    <input type="hidden" name="status" value="closed" />
                    <input name="note" placeholder="Motivo do fechamento" style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
                    <button type="submit" style={{ border: 0, borderRadius: 999, padding: "12px 16px", background: "#efe3db", color: "#7f3c20", cursor: "pointer" }}>Fechar lead</button>
                  </form>
                </Surface>
              </>
            ) : (
              <>
                <Surface>
                  <Eyebrow>Contato liberado</Eyebrow>
                  {lead.contactReleases.length > 0 ? lead.contactReleases.map((release) => (
                    <InfoCard key={release.id}>
                      {release.releasedEmail ? <p style={{ color: "var(--muted)" }}>E-mail: {release.releasedEmail}</p> : null}
                      {release.releasedPhone ? <p style={{ color: "var(--muted)" }}>Telefone: {release.releasedPhone}</p> : null}
                    </InfoCard>
                  )) : <p style={{ color: "var(--muted)" }}>Contato ainda nao liberado.</p>}
                </Surface>

                {session.role === "client" && reviewEligibility ? (
                  <Surface>
                    <Eyebrow>Review do atendimento</Eyebrow>
                    {reviewEligibility.canReview ? (
                      <form action="/auth/reviews" method="post" style={{ display: "grid", gap: 10, marginTop: 16 }}>
                        <input type="hidden" name="leadId" value={lead.id} />
                        {reviewEligibility.existingReviewId ? <input type="hidden" name="reviewId" value={reviewEligibility.existingReviewId} /> : null}
                        <input name="rating" type="number" min={1} max={5} defaultValue={5} required style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
                        <input name="title" placeholder="Titulo da sua avaliacao" required style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
                        <textarea name="comment" placeholder="Conte como foi o atendimento e a entrega" rows={4} required style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
                        <textarea name="evidenceNote" placeholder="Observacao ou prova textual opcional" rows={3} style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
                        <input name="evidenceReference" placeholder="Link ou referencia opcional" style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
                        <button type="submit" style={{ border: 0, borderRadius: 999, padding: "12px 16px", background: "var(--accent)", color: "#fff", cursor: "pointer" }}>
                          {reviewEligibility.existingReviewStatus === "more_info_required" ? "Reenviar review" : "Enviar review"}
                        </button>
                      </form>
                    ) : (
                      <p style={{ color: "var(--muted)", marginTop: 16 }}>
                        {reviewEligibility.reason === "REVIEW_ALREADY_EXISTS"
                          ? "Este lead ja possui uma review enviada."
                          : "A review sera liberada quando o contato estiver disponivel para o cliente."}
                      </p>
                    )}
                  </Surface>
                ) : null}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}