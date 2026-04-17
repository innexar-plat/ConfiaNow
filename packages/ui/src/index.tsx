import React, { type CSSProperties, type PropsWithChildren } from "react";

/* ============================================================
   ConfiaNow — UI Component Library
   RSC-compatible (no client hooks)
   ============================================================ */

// ---------------------------------------------------------------------------
// Surface — card branco com sombra suave, substitui o fundo marrom antigo
// ---------------------------------------------------------------------------
export function Surface({ children, style }: PropsWithChildren<{ style?: CSSProperties }>) {
  return (
    <section
      style={{
        background: "var(--surface)",
        border: "0.5px solid var(--line)",
        borderRadius: "var(--radius-xl)",
        padding: 24,
        boxShadow: "var(--shadow-sm)",
        ...style
      }}
    >
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Eyebrow — label verde uppercase acima de títulos
// ---------------------------------------------------------------------------
export function Eyebrow({ children }: PropsWithChildren) {
  return (
    <p style={{
      margin: 0,
      fontSize: 11,
      fontWeight: 600,
      color: "var(--green-primary)",
      textTransform: "uppercase",
      letterSpacing: "0.10em"
    }}>
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// SectionLabel — header de seção dentro de cards
// ---------------------------------------------------------------------------
export function SectionLabel({ children }: PropsWithChildren) {
  return (
    <p style={{
      margin: "0 0 12px",
      fontSize: 11,
      fontWeight: 600,
      color: "var(--subtle)",
      textTransform: "uppercase",
      letterSpacing: "0.09em"
    }}>
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// PageHeader — cabeçalho consistente de páginas internas
// ---------------------------------------------------------------------------
export function PageHeader({
  eyebrow,
  title,
  description,
  children
}: PropsWithChildren<{ eyebrow?: string; title: string; description?: string }>) {
  return (
    <Surface style={{ marginBottom: 0 }}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h1 style={{ margin: "10px 0 6px", fontSize: "clamp(1.4rem, 4vw, 2rem)", fontWeight: 500, lineHeight: 1.2, color: "var(--ink)" }}>
        {title}
      </h1>
      {description ? (
        <p style={{ color: "var(--muted)", maxWidth: 760, lineHeight: 1.65, fontSize: 14 }}>
          {description}
        </p>
      ) : null}
      {children}
    </Surface>
  );
}

// ---------------------------------------------------------------------------
// InfoCard — card compacto com hover lift via CSS class
// ---------------------------------------------------------------------------
export function InfoCard({ children, lift = false, style }: PropsWithChildren<{ lift?: boolean; style?: CSSProperties }>) {
  return (
    <article
      className={lift ? "card-lift" : undefined}
      style={{
        padding: 16,
        background: "var(--surface)",
        border: "0.5px solid var(--line)",
        borderRadius: "var(--radius-lg)",
        ...style
      }}
    >
      {children}
    </article>
  );
}

// ---------------------------------------------------------------------------
// StatCard — número grande + rótulo (para dashboards)
// ---------------------------------------------------------------------------
export function StatCard({ value, label, accent = false }: { value: string | number; label: string; accent?: boolean }) {
  return (
    <InfoCard style={{
      background: accent ? "var(--green-surface)" : "var(--surface)",
      borderColor: accent ? "var(--green-border)" : undefined,
      textAlign: "center",
      padding: 20
    }}>
      <p style={{
        fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
        fontWeight: 600,
        color: accent ? "var(--green-anchor)" : "var(--ink)",
        lineHeight: 1.1,
        marginBottom: 6
      }}>
        {value}
      </p>
      <p style={{ fontSize: 13, color: "var(--muted)" }}>{label}</p>
    </InfoCard>
  );
}

// ---------------------------------------------------------------------------
// Pill — tag inline, compatível com código legado (cor verde por padrão)
// ---------------------------------------------------------------------------
type PillVariant = "green" | "amber" | "blue" | "red" | "gray" | "white";
const pillStyles: Record<PillVariant, CSSProperties> = {
  green: { background: "var(--green-surface)", color: "var(--green-anchor)", border: "0.5px solid var(--green-border)" },
  amber: { background: "var(--amber-surface)", color: "var(--amber-text)",   border: "0.5px solid var(--amber-border)" },
  blue:  { background: "var(--blue-surface)",  color: "var(--blue-text)",    border: "0.5px solid var(--blue-border)" },
  red:   { background: "var(--red-surface)",   color: "var(--red-text)",     border: "0.5px solid var(--red-border)" },
  gray:  { background: "var(--surface-secondary)", color: "var(--muted)",    border: "0.5px solid var(--line-medium)" },
  white: { background: "#fff",                 color: "var(--muted)",        border: "0.5px solid var(--line-medium)" },
};
export function Pill({ children, variant = "green" }: PropsWithChildren<{ variant?: PillVariant }>) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: "var(--radius-full)",
      fontSize: 12,
      fontWeight: 500,
      ...pillStyles[variant]
    }}>
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Badge — verificado ConfiaNow com animação sealPop
// ---------------------------------------------------------------------------
export function VerifiedBadge({ size = 48 }: { size?: number }) {
  return (
    <div
      className="anim-seal anim-float"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, var(--green-primary), var(--green-anchor))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
        <polyline
          points="4,12 10,18 20,7"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="40"
          strokeDashoffset="0"
          style={{ animation: "checkDraw 0.5s ease 0.5s both" }}
        />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Avatar — círculo com iniciais
// ---------------------------------------------------------------------------
type AvatarColor = "green" | "amber" | "blue" | "gray";
const avatarColors: Record<AvatarColor, CSSProperties> = {
  green: { background: "var(--green-surface)", color: "var(--green-anchor)" },
  amber: { background: "var(--amber-surface)", color: "var(--amber-text)" },
  blue:  { background: "var(--blue-surface)",  color: "var(--blue-text)" },
  gray:  { background: "var(--surface-secondary)", color: "var(--muted)" },
};
export function Avatar({ initials, size = 40, color = "green" }: { initials: string; size?: number; color?: AvatarColor }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.35,
      fontWeight: 500,
      flexShrink: 0,
      ...avatarColors[color]
    }}>
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AlertBanner — faixa de alerta / info / erro
// ---------------------------------------------------------------------------
type AlertVariant = "info" | "success" | "warning" | "error";
const alertConfig: Record<AlertVariant, { bg: string; border: string; text: string; accent: string }> = {
  success: { bg: "var(--green-surface)",  border: "var(--green-primary)", text: "var(--green-anchor)", accent: "var(--green-border)" },
  info:    { bg: "var(--blue-surface)",   border: "#378ADD",              text: "var(--blue-text)",   accent: "var(--blue-border)" },
  warning: { bg: "var(--amber-surface)",  border: "var(--amber-primary)", text: "var(--amber-text)", accent: "var(--amber-border)" },
  error:   { bg: "var(--red-surface)",    border: "var(--red-primary)",   text: "var(--red-text)",   accent: "var(--red-border)" },
};
export function AlertBanner({ children, variant = "info" }: PropsWithChildren<{ variant?: AlertVariant }>) {
  const cfg = alertConfig[variant];
  return (
    <div style={{
      padding: "12px 16px",
      background: cfg.bg,
      borderLeft: `3px solid ${cfg.border}`,
      borderRadius: "0 var(--radius-md) var(--radius-md) 0",
      color: cfg.text,
      fontSize: 13,
      lineHeight: 1.55
    }}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EmptyState — estado vazio de lista
// ---------------------------------------------------------------------------
export function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      padding: "32px 16px",
      textAlign: "center",
      color: "var(--subtle)",
      fontSize: 14
    }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>○</div>
      {message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Divider — separador de seção
// ---------------------------------------------------------------------------
export function Divider() {
  return <hr style={{ border: "none", borderTop: "0.5px solid var(--line)", margin: "16px 0" }} />;
}
