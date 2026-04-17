import Link from "next/link";
import { Buildings, LockKey, UserCircle } from "@phosphor-icons/react/dist/ssr";
import { getSeededAdminCredentials } from "@platform/auth";
import { getPublicPlatformConfig } from "../../lib/platform-config";
import { AlertBanner, Eyebrow, InfoCard, Surface } from "../../../../../packages/ui/src";
import { NavBar } from "../../components/nav-bar";

const demoProfiles = [{ role: "admin", label: "Administrador demo" }];

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const config = getPublicPlatformConfig();
  const params = await searchParams;
  const adminCredentials = getSeededAdminCredentials();

  return (
    <>
      <NavBar />
      <main style={{ minHeight: "100vh", background: "var(--bg)", display: "grid", placeItems: "center", padding: "40px 20px" }}>
        <div style={{ width: "min(920px, 100%)", display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24, alignItems: "start" }}>

          {/* Login form */}
          <Surface style={{ padding: 32 }}>
            <div style={{ marginBottom: 24 }}>
              <Eyebrow>Acesso a plataforma</Eyebrow>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 500, margin: "10px 0 8px", color: "var(--ink)" }}>Entrar em {config.name}</h1>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
                Entre com seu email e senha para acessar seu painel.
              </p>
            </div>

            {params.error && (
              <div style={{ marginBottom: 20 }}>
                <AlertBanner variant="error">
                  Email ou senha invalidos. Verifique suas credenciais e tente novamente.
                </AlertBanner>
              </div>
            )}

            <form action="/auth/signin" method="post" style={{ display: "grid", gap: 14 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>Email</span>
                <input name="email" type="email" required placeholder="seu@email.com" className="form-input" />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>Senha</span>
                <input name="password" type="password" required placeholder="••••••••" className="form-input" />
              </label>
              <button type="submit" className="btn btn-primary btn-md btn-block" style={{ marginTop: 4 }}>
                Entrar
              </button>
            </form>

            <div style={{ marginTop: 20, paddingTop: 20, borderTop: "0.5px solid var(--line)", display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Link href="/register/client" style={{ fontSize: 13, color: "var(--green-primary)", fontWeight: 500 }}>Criar conta de cliente</Link>
              <Link href="/register/business" style={{ fontSize: 13, color: "var(--muted)" }}>Cadastrar meu negocio</Link>
            </div>
          </Surface>

          {/* Right sidebar */}
          <div style={{ display: "grid", gap: 12 }}>
            <InfoCard style={{ padding: 18 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <LockKey size={18} weight="duotone" color="var(--green-primary)" aria-hidden="true" />
                <strong style={{ fontSize: 14, color: "var(--ink)" }}>Acesso administrativo</strong>
              </div>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55, marginBottom: 10 }}>
                Em ambiente local use as credenciais de demo abaixo:
              </p>
              <code style={{ display: "block", fontSize: 12, background: "var(--surface-secondary)", padding: "8px 10px", borderRadius: "var(--radius-md)", color: "var(--ink)" }}>
                {adminCredentials.email}<br />{adminCredentials.password}
              </code>
            </InfoCard>

            <InfoCard lift style={{ padding: 18 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <UserCircle size={18} weight="duotone" color="var(--green-primary)" aria-hidden="true" />
                <strong style={{ fontSize: 14, color: "var(--ink)" }}>Sou cliente</strong>
              </div>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55, marginBottom: 12 }}>
                Crie uma conta para buscar, contratar e acompanhar prestadores verificados.
              </p>
              <Link href="/register/client" className="btn btn-sm btn-primary btn-block" style={{ textAlign: "center" }}>
                Criar conta gratis
              </Link>
            </InfoCard>

            <InfoCard lift style={{ padding: 18 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <Buildings size={18} weight="duotone" color="var(--green-primary)" aria-hidden="true" />
                <strong style={{ fontSize: 14, color: "var(--ink)" }}>Sou prestador</strong>
              </div>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55, marginBottom: 12 }}>
                Cadastre seu negocio, obtenha o selo verificado e receba leads qualificados.
              </p>
              <Link href="/register/business" className="btn btn-sm btn-green-soft btn-block" style={{ textAlign: "center" }}>
                Cadastrar meu negocio
              </Link>
            </InfoCard>

            {demoProfiles.map((profile) => (
              <Link
                key={profile.role}
                href={`/auth/demo/${profile.role}`}
                style={{ display: "block", padding: "12px 16px", borderRadius: "var(--radius-lg)", border: "0.5px dashed var(--line)", background: "var(--surface)", fontSize: 13, color: "var(--subtle)", textAlign: "center" }}
              >
                Entrar como {profile.label}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
