import Link from "next/link";
import { listClientLeads } from "@platform/leads";
import { Eyebrow, InfoCard, Pill, Surface } from "../../../../../../packages/ui/src";
import { requireDemoRole } from "../../../lib/session";

export default async function ClientLeadsPage() {
  const session = await requireDemoRole(["client"]);

  if (!session.id) {
    return (
      <main style={{ minHeight: "100vh", padding: 24 }}><Surface style={{ maxWidth: 860, margin: "0 auto" }}><Eyebrow>Meus leads</Eyebrow><p style={{ color: "var(--muted)" }}>Use uma conta real de cliente para acessar o historico.</p></Surface></main>
    );
  }

  const leads = await listClientLeads(session.id);

  return (
    <main style={{ minHeight: "100vh", padding: 24 }}>
      <Surface style={{ maxWidth: 1080, margin: "0 auto" }}>
        <Eyebrow>Historico do cliente</Eyebrow>
        <h1 style={{ margin: "12px 0" }}>Meus leads</h1>
        <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
          {leads.length > 0 ? leads.map((lead) => (
            <InfoCard key={lead.id}>
              <strong>{lead.subject}</strong>
              <p style={{ color: "var(--muted)" }}>{lead.businessName}</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                <Pill>{lead.status}</Pill>
                {lead.isLate ? <Pill>fora do SLA</Pill> : null}
              </div>
              <div style={{ marginTop: 12 }}><Link href={`/dashboard/leads/${lead.id}`}>Abrir lead</Link></div>
            </InfoCard>
          )) : <p style={{ color: "var(--muted)" }}>Voce ainda nao enviou leads.</p>}
        </div>
      </Surface>
    </main>
  );
}