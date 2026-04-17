import { ChartLineUp, ChartPieSlice, FileText, GearSix, LinkSimple, UsersThree, Buildings, WarningCircle } from "@phosphor-icons/react/dist/ssr";
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
            { href: "/admin", label: "Dashboard", icon: <ChartPieSlice size={16} weight="duotone" /> },
          ]
        },
        {
          title: "Moderacao",
          links: [
            { href: "/admin/users", label: "Usuarios", icon: <UsersThree size={16} weight="duotone" /> },
            { href: "/admin/businesses", label: "Negocios", icon: <Buildings size={16} weight="duotone" /> },
            { href: "/admin/reports", label: "Denuncias", icon: <WarningCircle size={16} weight="duotone" /> },
          ]
        },
        {
          title: "Conteudo",
          links: [
            { href: "/admin/pages", label: "Paginas CMS", icon: <FileText size={16} weight="duotone" /> },
          ]
        },
        {
          title: "Analytics",
          links: [
            { href: "/admin/analytics", label: "Relatorios", icon: <ChartLineUp size={16} weight="duotone" /> },
            { href: "/admin/integrations", label: "Integracoes", icon: <LinkSimple size={16} weight="duotone" /> },
          ]
        },
        {
          title: "Config",
          links: [
            { href: "/admin/settings", label: "Configuracoes", icon: <GearSix size={16} weight="duotone" /> },
          ]
        },
      ]}
    >
      {children}
    </AdminShell>
  );
}
