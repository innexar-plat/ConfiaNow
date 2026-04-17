import Link from "next/link";
import { AlertBanner, Eyebrow, InfoCard, Surface } from "../../../../../../packages/ui/src";
import { NavBar } from "../../../components/nav-bar";

export default async function RegisterClientPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      <NavBar />
      <main style={{ minHeight: "100vh", background: "var(--bg)", display: "grid", placeItems: "center", padding: "40px 20px" }}>
        <div style={{ width: "min(900px, 100%)", display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24, alignItems: "start" }}>

          <Surface style={{ padding: 32 }}>
            <Eyebrow>Cadastro cliente</Eyebrow>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 500, margin: "10px 0 8px", color: "var(--ink)" }}>Criar conta de cliente</h1>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, marginBottom: 24 }}>
              Crie sua conta gratuita e comece a contratar prestadores verificados com total seguranca.
            </p>

            {params.error && (
              <AlertBanner variant="error" style={{ marginBottom: 20 }}>
                Nao foi possivel concluir o cadastro. Verifique os dados e tente novamente.
              </AlertBanner>
            )}

            <form action="/auth/register/client" method="post" style={{ display: "grid", gap: 14 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>Nome completo</span>
                <input name="fullName" placeholder="Seu nome completo" required className="form-input" />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>CPF</span>
                  <input name="cpf" placeholder="000.000.000-00" required className="form-input" />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>Data de nascimento</span>
                  <input name="birthDate" type="date" required className="form-input" />
                </label>
              </div>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>Email</span>
                <input name="email" type="email" placeholder="seu@email.com" required className="form-input" />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>Celular</span>
                <input name="phone" placeholder="(11) 99999-9999" required className="form-input" />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>Senha</span>
                <input name="password" type="password" placeholder="Minimo 8 caracteres" required className="form-input" />
              </label>
              <button type="submit" className="btn btn-primary btn-md btn-block" style={{ marginTop: 4 }}>
                Criar conta gratis
              </button>
            </form>

            <div style={{ marginTop: 20, paddingTop: 20, borderTop: "0.5px solid var(--line)" }}>
              <Link href="/signin" style={{ fontSize: 13, color: "var(--muted)" }}>Ja tenho conta — entrar</Link>
            </div>
          </Surface>

          <div style={{ display: "grid", gap: 12 }}>
            <Surface style={{ padding: 20 }}>
              <Eyebrow>O que voce ganha</Eyebrow>
              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {[
                  { icon: "🔍", title: "Busque prestadores verificados", desc: "Acesse perfis com documentos, biometria e antecedentes checados." },
                  { icon: "🛡️", title: "Contrate com seguranca", desc: "Nosso sistema garante que voce conhece quem vai ate sua casa." },
                  { icon: "📋", title: "Acompanhe tudo", desc: "Historico de contatos, reviews e denuncias em um so lugar." },
                ].map(({ icon, title, desc }) => (
                  <InfoCard key={title} style={{ padding: 14 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 20 }}>{icon}</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 4px", color: "var(--ink)" }}>{title}</p>
                        <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, margin: 0 }}>{desc}</p>
                      </div>
                    </div>
                  </InfoCard>
                ))}
              </div>
            </Surface>

            <div style={{ padding: "14px 16px", background: "var(--green-surface)", border: "0.5px solid var(--green-border)", borderRadius: "var(--radius-lg)" }}>
              <p style={{ fontSize: 13, color: "var(--green-anchor)", fontWeight: 500, margin: "0 0 4px" }}>Conta 100% gratuita</p>
              <p style={{ fontSize: 12, color: "var(--green-primary)", margin: 0 }}>Sem taxa de cadastro. Pague apenas quando contratar.</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
