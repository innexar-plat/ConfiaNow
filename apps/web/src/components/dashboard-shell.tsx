import Link from "next/link";
import { type PropsWithChildren, type ReactNode } from "react";

/* ============================================================
   DashboardShell — layout com sidebar para dashboards
   Usado por: painel do cliente, prestador, admin
   RSC-compatible
   ============================================================ */

export interface SidebarLink {
  href: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
}

export interface SidebarSection {
  title?: string;
  links: SidebarLink[];
}

interface DashboardShellProps {
  sections: SidebarSection[];
  userName?: string;
  userRole?: string;
  userInitials?: string;
  backHref?: string;
  backLabel?: string;
}

export function DashboardShell({
  sections,
  userName,
  userRole,
  userInitials,
  backHref = "/",
  backLabel = "← Voltar ao início",
  children
}: PropsWithChildren<DashboardShellProps>) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "240px 1fr",
      minHeight: "100vh",
      background: "var(--bg)",
    }}>
      {/* ── Sidebar ── */}
      <aside style={{
        background: "var(--surface)",
        borderRight: "0.5px solid var(--line)",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
      }}>
        {/* Logo */}
        <div style={{
          padding: "18px 20px 14px",
          borderBottom: "0.5px solid var(--line)",
        }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: "var(--green-primary)" }}>Confia</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>Now</span>
            <span style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "var(--green-primary)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <polyline points="1.5,4.5 3.5,6.5 7.5,2.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        </div>

        {/* User info */}
        {userName ? (
          <div style={{
            padding: "14px 16px",
            borderBottom: "0.5px solid var(--line)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--green-surface)",
                color: "var(--green-anchor)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
                flexShrink: 0,
              }}>
                {userInitials ?? userName.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ overflow: "hidden" }}>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {userName}
                </p>
                {userRole ? (
                  <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>{userRole}</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {/* Navigation sections */}
        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 20 }}>
          {sections.map((section, i) => (
            <div key={i}>
              {section.title ? (
                <p className="sidebar-section-label" style={{ margin: "0 0 6px" }}>
                  {section.title}
                </p>
              ) : null}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`sidebar-link${link.active ? " active" : ""}`}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
                      {link.icon}
                    </span>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: "12px 14px",
          borderTop: "0.5px solid var(--line)",
        }}>
          <Link href={backHref} className="sidebar-link" style={{ fontSize: 13, color: "var(--subtle)" }}>
            {backLabel}
          </Link>
          <Link href="/signin" className="sidebar-link" style={{ fontSize: 13, color: "var(--subtle)" }}>
            ⟵ Sair
          </Link>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ padding: 28, minWidth: 0, overflowX: "hidden" }}>
        {children}
      </main>
    </div>
  );
}

/* ============================================================
   AdminShell — layout admin com sidebar mais larga
   ============================================================ */
export function AdminShell({
  sections,
  children
}: PropsWithChildren<{ sections: SidebarSection[] }>) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "260px 1fr",
      minHeight: "100vh",
      background: "var(--bg)",
    }}>
      {/* ── Admin sidebar ── */}
      <aside style={{
        background: "var(--ink)",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
      }}>
        {/* Logo */}
        <div style={{
          padding: "20px 20px 16px",
          borderBottom: "0.5px solid rgba(255,255,255,0.08)",
        }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: "var(--green-primary)" }}>Confia</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>Now</span>
          </Link>
          <div style={{
            marginTop: 6,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            borderRadius: "var(--radius-full)",
            background: "rgba(29,158,117,0.15)",
            border: "0.5px solid rgba(29,158,117,0.3)",
          }}>
            <span className="dot dot-green" />
            <span style={{ fontSize: 10, fontWeight: 500, color: "var(--green-primary)" }}>Painel Admin</span>
          </div>
        </div>

        {/* Nav sections */}
        <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 24 }}>
          {sections.map((section, i) => (
            <div key={i}>
              {section.title ? (
                <p style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.35)",
                  textTransform: "uppercase",
                  letterSpacing: "0.10em",
                  padding: "0 14px",
                  marginBottom: 4,
                }}>
                  {section.title}
                </p>
              ) : null}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 14px",
                      borderRadius: "var(--radius-md)",
                      fontSize: 14,
                      color: link.active ? "#fff" : "rgba(255,255,255,0.6)",
                      background: link.active ? "rgba(29,158,117,0.18)" : "transparent",
                      fontWeight: link.active ? 500 : 400,
                      transition: "all var(--t-fast)",
                      textDecoration: "none",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
                      {link.icon}
                    </span>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: "12px 10px",
          borderTop: "0.5px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}>
          <Link href="/" style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 14px", borderRadius: "var(--radius-md)",
            fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none",
          }}>
            🌐 Ver site público
          </Link>
          <Link href="/signin" style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 14px", borderRadius: "var(--radius-md)",
            fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none",
          }}>
            ⟵ Sair
          </Link>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ padding: 28, minWidth: 0, overflowX: "hidden" }}>
        {children}
      </main>
    </div>
  );
}
