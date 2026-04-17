import Link from "next/link";
import { Eyebrow, InfoCard, SectionLabel, StatCard, Surface } from "../../../../../packages/ui/src";

export default async function AdminDashboardPage() {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 500, margin: "0 0 4px", color: "var(--ink)" }}>Dashboard Administrativo</h1>
        <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>Visao geral da plataforma e atalhos de operacao.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard value="—" label="Usuarios ativos" />
        <StatCard value="—" label="Negocios cadastrados" />
        <StatCard value="—" label="Denuncias abertas" accent />
        <StatCard value="—" label="Leads hoje" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Surface>
          <Eyebrow>Acoes rapidas</Eyebrow>
          <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
            <Link href="/admin/businesses" className="nav-link">Revisar negocios pendentes de verificacao</Link>
            <Link href="/admin/reports" className="nav-link">Moderar denuncias abertas</Link>
            <Link href="/admin/users" className="nav-link">Gerenciar usuarios</Link>
            <Link href="/admin/pages" className="nav-link">Editar paginas CMS</Link>
          </div>
        </Surface>

        <Surface>
          <Eyebrow>Status da plataforma</Eyebrow>
          <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
            {[
              { label: "API backend", status: "Operacional", ok: true },
              { label: "Banco de dados", status: "Operacional", ok: true },
              { label: "Fila de verificacao", status: "Ativa", ok: true },
              { label: "Envio de emails", status: "Ativo", ok: true },
            ].map(({ label, status, ok }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "0.5px solid var(--line)" }}>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>{label}</span>
                <span className={ok ? "dot dot-green" : "dot dot-red"} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: ok ? "var(--green-primary)" : "var(--red-primary)" }}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}
