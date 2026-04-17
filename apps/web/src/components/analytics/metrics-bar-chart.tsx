import React from "react";

type MetricsBarChartProps = {
  title: string;
  series: Array<{
    label: string;
    value: number;
  }>;
  color?: string;
  emptyLabel?: string;
};

export function MetricsBarChart({
  title,
  series,
  color = "linear-gradient(180deg, #d46a37 0%, #8f3d1d 100%)",
  emptyLabel = "No data available for this period."
}: MetricsBarChartProps) {
  const maxValue = Math.max(...series.map((item) => item.value), 0);

  return (
    <section aria-label={title} style={{ display: "grid", gap: 14 }}>
      <strong>{title}</strong>
      {series.length === 0 || maxValue === 0 ? (
        <p style={{ color: "var(--muted)" }}>{emptyLabel}</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))`, gap: 10, alignItems: "end", minHeight: 180 }}>
          {series.map((item) => {
            const height = maxValue === 0 ? 0 : Math.max(8, Math.round((item.value / maxValue) * 140));
            return (
              <div key={`${item.label}-${item.value}`} style={{ display: "grid", gap: 8, justifyItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{item.value}</span>
                <div
                  aria-label={`${item.label}: ${item.value}`}
                  style={{
                    width: "100%",
                    maxWidth: 44,
                    height,
                    borderRadius: 16,
                    background: color,
                    boxShadow: "inset 0 -8px 18px rgba(0, 0, 0, 0.16)"
                  }}
                />
                <span style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>{item.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
