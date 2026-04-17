import { Eyebrow, InfoCard, SectionLabel, Surface } from "../../../../../../packages/ui/src";
import { getPublicPlatformConfig } from "../../../lib/platform-config";

export default async function AdminSettingsPage() {
  const config = getPublicPlatformConfig();

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 500, margin: "0 0 4px", color: "var(--ink)" }}>Configuracoes</h1>
        <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>Gerencie as configuracoes globais da plataforma.</p>
      </div>

      <Surface>
        <Eyebrow>Plataforma</Eyebrow>
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <InfoCard style={{ padding: 16 }}>
            <SectionLabel>Nome da plataforma</SectionLabel>
            <p style={{ fontSize: 14, color: "var(--ink)", margin: "6px 0 0" }}>{config.name}</p>
            <p style={{ fontSize: 12, color: "var(--subtle)", margin: "4px 0 0" }}>Configurado via variavel de ambiente PLATFORM_NAME</p>
          </InfoCard>
          <InfoCard style={{ padding: 16 }}>
            <SectionLabel>Ambiente</SectionLabel>
            <p style={{ fontSize: 14, color: "var(--ink)", margin: "6px 0 0" }}>{process.env.NODE_ENV ?? "development"}</p>
          </InfoCard>
        </div>
      </Surface>

      <Surface>
        <Eyebrow>Recursos ativos</Eyebrow>
        <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
          {[
            "Verificacao documental",
            "Biometria facial",
            "Checagem de antecedentes",
            "Discovery publico",
            "Painel cliente",
            "Painel prestador",
          ].map((feature) => (
            <div key={feature} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "0.5px solid var(--line)" }}>
              <span style={{ fontSize: 13, color: "var(--ink)" }}>{feature}</span>
              <span className="tag tag-green">Ativo</span>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}
