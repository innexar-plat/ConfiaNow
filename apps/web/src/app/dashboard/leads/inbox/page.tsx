import Link from "next/link";
import { listBusinessLeadInbox } from "@platform/leads";
import { Eyebrow, InfoCard, Pill, Surface } from "../../../../../../../packages/ui/src";
import { requireDemoRole } from "../../../../lib/session";

export default async function BusinessLeadInboxPage() {
  const session = await requireDemoRole(["business"]);

  if (!session.id) {
    return (
      <main style={{ minHeight: "100vh", padding: 24 }}><Surface style={{ maxWidth: 860, margin: "0 auto" }}><Eyebrow>Inbox de leads</Eyebrow><p style={{ color: "var(--muted)" }}>Use uma conta real de negocio para acessar o inbox.</p></Surface></main>
    );
  }

  const leads = await listBusinessLeadInbox(session.id);

  return (
    <main style={{ minHeight: "100vh", padding: 24 }}>
      <Surface style={{ maxWidth: 1080, margin: "0 auto" }}>
        <Eyebrow>Inbox do negocio</Eyebrow>
        <h1 style={{ margin: "12px 0" }}>Leads recebidos</h1>
        <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
          {leads.length > 0 ? leads.map((lead) => (
            <InfoCard key={lead.id}>
              <strong>{lead.subject}</strong>
              <p style={{ color: "var(--muted)" }}>Cliente: {lead.clientName}</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                <Pill>{lead.status}</Pill>
                {lead.isLate ? <Pill>fora do SLA</Pill> : null}
              </div>
              <div style={{ marginTop: 12 }}><Link href={`/dashboard/leads/${lead.id}`}>Abrir lead</Link></div>
            </InfoCard>
          )) : <p style={{ color: "var(--muted)" }}>Nenhum lead recebido ainda.</p>}
        </div>
      </Surface>
    </main>
  );
}