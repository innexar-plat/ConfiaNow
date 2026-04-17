import React from "react";
import { InfoCard, Pill } from "../../../../../packages/ui/src";

type IntegrationStatusItem = {
  provider: string;
  events: {
    total: number;
    processing: number;
    failed: number;
    deadLetter: number;
  };
  jobs: {
    pending: number;
    running: number;
    failed: number;
  };
  lastEventAt: Date | string | null;
};

export function IntegrationStatusCards({ items }: { items: IntegrationStatusItem[] }) {
  if (items.length === 0) {
    return <p data-testid="integration-status-empty" style={{ color: "var(--muted)" }}>Nenhuma integracao registrada.</p>;
  }

  return (
    <div data-testid="integration-status-cards" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
      {items.map((item) => (
        <InfoCard key={item.provider}>
          <strong>{item.provider}</strong>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <Pill>{item.events.total} eventos</Pill>
            <Pill>{item.events.processing} processando</Pill>
            <Pill>{item.events.failed + item.events.deadLetter} falhas</Pill>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <Pill>{item.jobs.pending} jobs pendentes</Pill>
            <Pill>{item.jobs.running} em execucao</Pill>
            <Pill>{item.jobs.failed} jobs falhos</Pill>
          </div>
          <p style={{ color: "var(--muted)", marginTop: 10 }}>
            Ultimo evento: {item.lastEventAt ? new Date(item.lastEventAt).toLocaleString("pt-BR") : "nunca"}
          </p>
        </InfoCard>
      ))}
    </div>
  );
}
