import { requireDemoRole } from "../../lib/session";
import { AdminShell } from "../../components/dashboard-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireDemoRole(["admin"]);

  return (
    <AdminShell
      sections={[
        {
          title: "Visao geral",
          links: [
            { href: "/admin", label: "Dashboard", icon: "📊" },
          ]
        },
        {
          title: "Moderacao",
          links: [
            { href: "/admin/users", label: "Usuarios", icon: "👥" },
            { href: "/admin/businesses", label: "Negocios", icon: "🏢" },
            { href: "/admin/reports", label: "Denuncias", icon: "🚨" },
          ]
        },
        {
          title: "Conteudo",
          links: [
            { href: "/admin/pages", label: "Paginas CMS", icon: "📄" },
          ]
        },
        {
          title: "Analytics",
          links: [
            { href: "/admin/analytics", label: "Relatorios", icon: "📈" },
            { href: "/admin/integrations", label: "Integracoes", icon: "🔗" },
          ]
        },
        {
          title: "Config",
          links: [
            { href: "/admin/settings", label: "Configuracoes", icon: "⚙️" },
          ]
        },
      ]}
    >
      {children}
    </AdminShell>
  );
}
