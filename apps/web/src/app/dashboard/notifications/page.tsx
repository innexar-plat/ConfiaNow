import Link from "next/link";
import { getNotificationPreferences, listNotifications } from "@platform/notifications";
import { Eyebrow, InfoCard, Pill, Surface } from "../../../../../../packages/ui/src";
import { requireDemoRole } from "../../../lib/session";

export default async function NotificationsPage({
  searchParams
}: {
  searchParams: Promise<{ read?: string; preferencesUpdated?: string; error?: string }>;
}) {
  const session = await requireDemoRole(["client", "business", "admin"]);
  const params = await searchParams;

  if (!session.id) {
    return (
      <main style={{ minHeight: "100vh", padding: 24 }}>
        <Surface style={{ maxWidth: 860, margin: "0 auto" }}>
          <Eyebrow>Notificacoes</Eyebrow>
          <p style={{ color: "var(--muted)" }}>Use uma conta real para acessar o inbox de notificacoes.</p>
        </Surface>
      </main>
    );
  }

  const [notifications, preferences] = await Promise.all([
    listNotifications({ userId: session.id, limit: 30 }),
    getNotificationPreferences(session.id)
  ]);

  return (
    <main style={{ minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gap: 20 }}>
        <Surface>
          <Eyebrow>Inbox de notificacoes</Eyebrow>
          <h1 style={{ margin: "12px 0" }}>Central de notificacoes</h1>
          <p style={{ color: "var(--muted)", maxWidth: 760 }}>
            Acompanhe alertas transacionais e ajuste as preferencias para controlar o tipo de mensagem recebida.
          </p>

          <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Pill>Total: {notifications.meta.total}</Pill>
            <Pill>Nao lidas: {notifications.meta.unreadCount}</Pill>
          </div>

          {params.read ? <p style={{ color: "var(--accent-strong)", marginTop: 14 }}>Notificacao marcada como lida.</p> : null}
          {params.preferencesUpdated ? <p style={{ color: "var(--accent-strong)", marginTop: 14 }}>Preferencias atualizadas com sucesso.</p> : null}
          {params.error ? <p style={{ color: "#8f3d1d", marginTop: 14 }}>Nao foi possivel concluir a operacao solicitada.</p> : null}
        </Surface>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          <Surface>
            <Eyebrow>Preferencias</Eyebrow>
            <form action="/auth/notification-preferences" method="post" style={{ display: "grid", gap: 12, marginTop: 16 }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" name="inAppEnabled" defaultChecked={preferences.inAppEnabled} />
                Inbox in-app
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" name="emailEnabled" defaultChecked={preferences.emailEnabled} />
                Email
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" name="pushEnabled" defaultChecked={preferences.pushEnabled} />
                Push
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" name="leadAlertsEnabled" defaultChecked={preferences.leadAlertsEnabled} />
                Alertas de lead
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" name="reviewAlertsEnabled" defaultChecked={preferences.reviewAlertsEnabled} />
                Alertas de review
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" name="marketingEnabled" defaultChecked={preferences.marketingEnabled} />
                Campanhas e reengajamento
              </label>

              <button type="submit" style={{ border: 0, borderRadius: 999, padding: "10px 14px", background: "var(--accent)", color: "#fff", cursor: "pointer" }}>
                Salvar preferencias
              </button>
            </form>
          </Surface>

          <Surface>
            <Eyebrow>Atalhos</Eyebrow>
            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              <Link href="/dashboard">Voltar para dashboard</Link>
              <Link href="/dashboard/leads">Ver historico de leads</Link>
              {session.role === "admin" ? <Link href="/admin/settings">Abrir admin settings</Link> : null}
            </div>
          </Surface>
        </section>

        <Surface>
          <Eyebrow>Mensagens</Eyebrow>
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {notifications.data.length > 0 ? notifications.data.map((notification) => (
              <InfoCard key={notification.id}>
                <strong>{notification.title}</strong>
                <p style={{ color: "var(--muted)" }}>{notification.body}</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                  <Pill>{notification.type}</Pill>
                  {notification.isRead ? <Pill>lida</Pill> : <Pill>nao lida</Pill>}
                </div>
                {!notification.isRead ? (
                  <form action={`/auth/notifications/${notification.id}/read`} method="post" style={{ marginTop: 12 }}>
                    <button type="submit" style={{ border: 0, background: "transparent", color: "var(--accent-strong)", cursor: "pointer", padding: 0 }}>
                      Marcar como lida
                    </button>
                  </form>
                ) : null}
              </InfoCard>
            )) : <p style={{ color: "var(--muted)" }}>Nenhuma notificacao ainda.</p>}
          </div>
        </Surface>
      </div>
    </main>
  );
}
