import Link from "next/link";
import {
  getCurrentSubscription,
  listBillingInvoices,
  listCurrentBoosts,
  listPlans
} from "@platform/billing";
import { Eyebrow, InfoCard, Pill, Surface } from "../../../../../../packages/ui/src";
import { requireDemoRole } from "../../../lib/session";
import { BillingPlanSelector } from "./billing-plan-selector";

export default async function BillingDashboardPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireDemoRole(["business"]);
  const query = await searchParams;

  if (!session.id) {
    return (
      <main style={{ minHeight: "100vh", padding: 24 }}>
        <Surface style={{ maxWidth: 860, margin: "0 auto" }}>
          <Eyebrow>Billing</Eyebrow>
          <h1 style={{ margin: "12px 0" }}>Billing real indisponivel na sessao demo</h1>
          <p style={{ color: "var(--muted)" }}>Use uma conta de negocio autenticada para contratar plano, liberar boosts e consultar invoices reais.</p>
        </Surface>
      </main>
    );
  }

  const [plans, currentSubscription, invoices, boosts] = await Promise.all([
    listPlans(),
    getCurrentSubscription(session.id),
    listBillingInvoices(session.id),
    listCurrentBoosts(session.id)
  ]);

  const checkoutRef = typeof query.checkout === "string" ? query.checkout : undefined;
  const pendingPayments = invoices.data.flatMap((invoice) =>
    invoice.payments
      .filter((payment) => payment.status === "pending")
      .map((payment) => ({
        invoiceId: invoice.id,
        invoiceDescription: invoice.description,
        paymentId: payment.id,
        providerReference: payment.providerReference,
        amountCents: payment.amountCents
      }))
  );
  const highlightedPayments = checkoutRef
    ? pendingPayments.filter((payment) => payment.providerReference === checkoutRef)
    : pendingPayments;

  return (
    <main style={{ minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 20 }}>
        <Surface>
          <Eyebrow>Monetization billing</Eyebrow>
          <h1 style={{ margin: "12px 0" }}>Plano, invoices e boosts comerciais</h1>
          <p style={{ color: "var(--muted)", maxWidth: 780 }}>
            Contrate o plano pago do negocio, acompanhe o historico financeiro e ative boosts patrocinados com confirmacao por webhook local assinado.
          </p>

          <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Pill>Plano {currentSubscription.planName}</Pill>
            <Pill>Status {currentSubscription.status}</Pill>
            <Pill>{boosts.meta.total} boost(s) ativo(s) ou pendente(s)</Pill>
            <Pill>{invoices.meta.total} invoice(s)</Pill>
          </div>

          {query.subscriptionCreated ? <p style={{ color: "var(--accent-strong)", marginTop: 14 }}>Checkout de assinatura criado. Confirme o pagamento no provedor local abaixo.</p> : null}
          {query.subscriptionUpdated ? <p style={{ color: "var(--accent-strong)", marginTop: 14 }}>Mudanca de plano criada. Confirme o pagamento para ativar o novo ciclo.</p> : null}
          {query.subscriptionCanceled ? <p style={{ color: "var(--accent-strong)", marginTop: 14 }}>Cancelamento registrado com sucesso.</p> : null}
          {query.boostCreated ? <p style={{ color: "var(--accent-strong)", marginTop: 14 }}>Checkout do boost criado. Confirme o pagamento para subir no discovery.</p> : null}
          {query.paymentSimulated ? <p style={{ color: "var(--accent-strong)", marginTop: 14 }}>Webhook local processado com sucesso.</p> : null}
          {query.error ? <p style={{ color: "#8f3d1d", marginTop: 14 }}>Nao foi possivel concluir a operacao solicitada.</p> : null}
        </Surface>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          <InfoCard>
            <strong>{currentSubscription.planName}</strong>
            <p style={{ color: "var(--muted)" }}>Status atual: {currentSubscription.status}.</p>
            <p style={{ color: "var(--muted)" }}>Benefits active: {currentSubscription.hasActiveBenefits ? "yes" : "no"}.</p>
          </InfoCard>
          <InfoCard>
            <strong>Current period</strong>
            <p style={{ color: "var(--muted)" }}>{currentSubscription.currentPeriodEnd ? new Date(currentSubscription.currentPeriodEnd).toLocaleString("pt-BR") : "Nenhum ciclo confirmado ainda."}</p>
          </InfoCard>
          <InfoCard>
            <strong>Boost bonus</strong>
            <p style={{ color: "var(--muted)" }}>Cada boost ativo aumenta a exposicao do negocio no discovery.</p>
          </InfoCard>
        </section>

        <Surface>
          <Eyebrow>Planos</Eyebrow>
          <BillingPlanSelector plans={plans} currentSubscription={currentSubscription} />

          {currentSubscription.id ? (
            <form action="/auth/subscriptions/current/cancel" method="post" style={{ marginTop: 16 }}>
              <button type="submit" style={{ border: 0, borderRadius: 999, padding: "10px 14px", background: "#efe3db", color: "#7f3c20", cursor: "pointer" }}>
                Cancelar assinatura
              </button>
            </form>
          ) : null}
        </Surface>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          <Surface>
            <Eyebrow>Boosts</Eyebrow>
            <form action="/auth/boosts" method="post" style={{ display: "grid", gap: 10, marginTop: 16, maxWidth: 360 }}>
              <input name="durationDays" type="number" min={3} max={30} defaultValue={7} style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)" }} />
              <button type="submit" style={{ border: 0, borderRadius: 999, padding: "12px 16px", background: "#1d1a16", color: "#fff", cursor: "pointer" }}>
                Criar boost pago
              </button>
            </form>

            <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
              {boosts.data.length > 0 ? boosts.data.map((boost) => (
                <InfoCard key={boost.id}>
                  <strong>{boost.status}</strong>
                  <p style={{ color: "var(--muted)" }}>${(boost.amountCents / 100).toFixed(2)} | {boost.endsAt ? `termina ${new Date(boost.endsAt).toLocaleString("pt-BR")}` : "aguardando pagamento"}</p>
                </InfoCard>
              )) : <p style={{ color: "var(--muted)" }}>Nenhum boost criado ainda.</p>}
            </div>
          </Surface>

          <Surface>
            <Eyebrow>Provider local</Eyebrow>
            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              {highlightedPayments.length > 0 ? highlightedPayments.map((payment) => (
                <InfoCard key={payment.paymentId}>
                  <strong>{payment.invoiceDescription}</strong>
                  <p style={{ color: "var(--muted)" }}>Referencia {payment.providerReference ?? "sem referencia"}</p>
                  <p style={{ color: "var(--muted)" }}>${(payment.amountCents / 100).toFixed(2)}</p>
                  <form action="/auth/billing/simulate-payment" method="post" style={{ marginTop: 10 }}>
                    <input type="hidden" name="paymentId" value={payment.paymentId} />
                    <input type="hidden" name="checkout" value={payment.providerReference ?? ""} />
                    <button type="submit" style={{ border: 0, borderRadius: 999, padding: "10px 14px", background: "var(--accent)", color: "#fff", cursor: "pointer" }}>
                      Confirmar pagamento local
                    </button>
                  </form>
                </InfoCard>
              )) : <p style={{ color: "var(--muted)" }}>Nenhum pagamento pendente. Crie um checkout acima para testar o webhook real do modulo.</p>}
            </div>
          </Surface>
        </section>

        <Surface>
          <Eyebrow>Historico financeiro</Eyebrow>
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {invoices.data.length > 0 ? invoices.data.map((invoice) => (
              <InfoCard key={invoice.id}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <strong>{invoice.description}</strong>
                  <Pill>{invoice.type}</Pill>
                  <Pill>{invoice.status}</Pill>
                </div>
                <p style={{ color: "var(--muted)" }}>${(invoice.amountCents / 100).toFixed(2)} | criado em {new Date(invoice.createdAt).toLocaleString("pt-BR")}</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {invoice.payments.map((payment) => (
                    <Pill key={payment.id}>{payment.status}</Pill>
                  ))}
                </div>
              </InfoCard>
            )) : <p style={{ color: "var(--muted)" }}>Nenhuma cobranca registrada ainda.</p>}
          </div>
        </Surface>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Link href="/dashboard">Voltar ao dashboard</Link>
          <Link href="/dashboard/business-profile">Gerir perfil publico</Link>
          <Link href="/dashboard/notifications">Abrir central de notificacoes</Link>
        </div>
      </div>
    </main>
  );
}
