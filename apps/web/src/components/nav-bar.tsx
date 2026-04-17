import Link from "next/link";
import { type CSSProperties } from "react";

/* ============================================================
   NavBar — barra de navegação pública ConfiaNow
   RSC-compatible (sem hooks de cliente)
   ============================================================ */

interface NavBarProps {
  userName?: string;
  userRole?: "client" | "business" | "admin";
  activePath?: string;
}

const roleLabel: Record<string, string> = {
  client: "Cliente",
  business: "Prestador",
  admin: "Admin",
};

const roleColor: Record<string, CSSProperties> = {
  client:   { background: "var(--blue-surface)",  color: "var(--blue-text)" },
  business: { background: "var(--green-surface)", color: "var(--green-anchor)" },
  admin:    { background: "var(--amber-surface)", color: "var(--amber-text)" },
};

export function NavBar({ userName, userRole, activePath }: NavBarProps) {
  const links = [
    { href: "/",              label: "Início" },
    { href: "/?",             label: "Buscar" },
    { href: "/trust",         label: "Como funciona" },
    { href: "/verification",  label: "Seja parceiro" },
  ];

  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(12px)",
      borderBottom: "0.5px solid var(--line)",
      padding: "0 20px",
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 56,
        gap: 8,
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: "var(--green-primary)" }}>Confia</span>
          <span style={{ fontSize: 17, fontWeight: 600, color: "var(--ink)" }}>Now</span>
          {/* Verified dot */}
          <span style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "var(--green-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <polyline points="2,5 4,7 8,3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </Link>

        {/* Center links (hidden on small screens via CSS would need media queries — kept inline for RSC) */}
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {links.map(({ href, label }) => {
            const isActive = activePath === href;
            return (
              <Link
                key={href}
                href={href}
                className={`nav-link${isActive ? " active" : ""}`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {userName && userRole ? (
            <>
              {/* User pill */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 10px 5px 5px",
                borderRadius: "var(--radius-full)",
                border: "0.5px solid var(--line-medium)",
                background: "var(--surface)",
              }}>
                <div style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 600,
                  ...roleColor[userRole],
                }}>
                  {userName.slice(0, 2).toUpperCase()}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{userName}</span>
                <span style={{
                  fontSize: 10,
                  padding: "2px 6px",
                  borderRadius: "var(--radius-full)",
                  fontWeight: 500,
                  ...roleColor[userRole],
                }}>
                  {roleLabel[userRole]}
                </span>
              </div>
              {/* Dashboard link */}
              <Link href="/dashboard" className="btn btn-sm btn-green-soft">
                Painel
              </Link>
            </>
          ) : (
            <>
              <Link href="/signin" className="btn btn-sm btn-ghost">Entrar</Link>
              <Link href="/register/client" className="btn btn-sm btn-primary">Cadastrar</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
