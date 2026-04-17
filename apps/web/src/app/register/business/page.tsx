import Link from "next/link";
import { ChartLineUp, Megaphone, ShieldCheck, TrayArrowDown } from "@phosphor-icons/react/dist/ssr";
import { AlertBanner, Eyebrow, InfoCard, Surface } from "../../../../../../packages/ui/src";
import { NavBar } from "../../../components/nav-bar";

export default async function RegisterBusinessPage({
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
            <Eyebrow>Cadastro negocio</Eyebrow>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 500, margin: "10px 0 8px", color: "var(--ink)" }}>Cadastrar meu negocio</h1>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, marginBottom: 24 }}>
              Preencha os dados abaixo para iniciar o processo de verificacao e comecar a receber leads qualificados.
            </p>

            {params.error && (
              <div style={{ marginBottom: 20 }}>
                <AlertBanner variant="error">
                  Nao foi possivel concluir o cadastro. Verifique os dados e tente novamente.
                </AlertBanner>
              </div>
            )}

            <form action="/auth/register/business" method="post" style={{ display: "grid", gap: 14 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>Nome do negocio</span>
                <input name="businessName" placeholder="Ex: Eletrica Profissional Santos" required className="form-input" />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>Responsavel legal</span>
                  <input name="legalRepresentativeName" placeholder="Nome completo" required className="form-input" />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>CPF do responsavel</span>
                  <input name="legalRepresentativeCpf" placeholder="000.000.000-00" required className="form-input" />
                </label>
              </div>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>CNPJ</span>
                <input name="cnpj" placeholder="00.000.000/0000-00" required className="form-input" />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>Email comercial</span>
                <input name="email" type="email" placeholder="contato@seunegocio.com" required className="form-input" />
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
                Iniciar cadastro
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
                  { Icon: Megaphone, title: "Perfil publico verificado", desc: "Apareca na busca de clientes com o selo de confianca visivel." },
                  { Icon: TrayArrowDown, title: "Leads qualificados", desc: "Receba solicitacoes de clientes que ja sabem que voce e verificado." },
                  { Icon: ShieldCheck, title: "Selo ConfiaNow", desc: "Um diferencial competitivo que aumenta sua taxa de conversao." },
                  { Icon: ChartLineUp, title: "Painel de performance", desc: "Acompanhe visualizacoes, leads, reviews e seu indice de confianca." },
                ].map(({ Icon, title, desc }) => (
                  <InfoCard key={title} style={{ padding: 12 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <Icon size={18} weight="duotone" color="var(--green-primary)" aria-hidden="true" />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 3px", color: "var(--ink)" }}>{title}</p>
                        <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, margin: 0 }}>{desc}</p>
                      </div>
                    </div>
                  </InfoCard>
                ))}
              </div>
            </Surface>

            <div style={{ padding: "14px 16px", background: "var(--amber-surface)", border: "0.5px solid var(--amber-primary)", borderRadius: "var(--radius-lg)" }}>
              <p style={{ fontSize: 13, color: "var(--amber-text)", fontWeight: 500, margin: "0 0 4px" }}>Verificacao necessaria</p>
              <p style={{ fontSize: 12, color: "var(--amber-text)", margin: 0 }}>Apos o cadastro, envie os documentos para obter o selo verificado e aparecer na busca.</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
