"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "platform-consent-v1";

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = window.localStorage.getItem(STORAGE_KEY);
    setVisible(!accepted);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        maxWidth: 360,
        background: "rgba(29, 26, 22, 0.96)",
        color: "#fffaf4",
        borderRadius: 20,
        padding: 18,
        boxShadow: "0 18px 40px rgba(0, 0, 0, 0.24)",
        zIndex: 50
      }}
    >
      <strong style={{ display: "block", marginBottom: 8 }}>Privacidade e termos</strong>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "rgba(255, 250, 244, 0.82)" }}>
        Esta base inicial usa consentimento simplificado para preparar o core da plataforma. O fluxo completo entra na etapa de autenticacao real.
      </p>
      <button
        type="button"
        onClick={() => {
          window.localStorage.setItem(STORAGE_KEY, "accepted");
          setVisible(false);
        }}
        style={{
          marginTop: 14,
          border: 0,
          borderRadius: 999,
          padding: "10px 14px",
          background: "var(--accent)",
          color: "white",
          cursor: "pointer"
        }}
      >
        Entendi
      </button>
    </div>
  );
}
