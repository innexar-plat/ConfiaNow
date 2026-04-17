import React from "react";
import type { BillingPlanView, CurrentSubscriptionView } from "@platform/billing";
import { InfoCard, Pill } from "../../../../../../packages/ui/src";

export function BillingPlanSelector({
  plans,
  currentSubscription
}: {
  plans: BillingPlanView[];
  currentSubscription: CurrentSubscriptionView;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 16 }}>
      {plans.filter((plan) => plan.code !== "free").map((plan) => {
        const isCurrentPlan = currentSubscription.planCode === plan.code && currentSubscription.status === "active";
        const action = currentSubscription.id ? "/auth/subscriptions/current" : "/auth/subscriptions";
        const buttonLabel = isCurrentPlan
          ? "Plano atual"
          : currentSubscription.id
            ? currentSubscription.planCode === "free"
              ? "Assinar agora"
              : "Alterar plano"
            : "Assinar agora";

        return (
          <InfoCard key={plan.code}>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <strong>{plan.name}</strong>
                {plan.recommended ? <Pill>recomendado</Pill> : null}
                <Pill>{plan.interval}</Pill>
              </div>

              <p style={{ color: "var(--muted)", margin: 0 }}>{plan.description}</p>
              <strong>${(plan.priceCents / 100).toFixed(2)}</strong>
              <p style={{ color: "var(--muted)", margin: 0 }}>Verification fee: ${(plan.verificationFeeCents / 100).toFixed(2)} when applicable.</p>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {plan.features.map((feature) => <Pill key={feature}>{feature}</Pill>)}
              </div>

              <form action={action} method="post" style={{ marginTop: 6 }}>
                <input type="hidden" name="planCode" value={plan.code} />
                <button
                  type="submit"
                  disabled={isCurrentPlan}
                  style={{
                    border: 0,
                    borderRadius: 999,
                    padding: "12px 16px",
                    background: isCurrentPlan ? "#d9d6cf" : "var(--accent)",
                    color: isCurrentPlan ? "#4f4b45" : "#fff",
                    cursor: isCurrentPlan ? "default" : "pointer"
                  }}
                >
                  {buttonLabel}
                </button>
              </form>
            </div>
          </InfoCard>
        );
      })}
    </div>
  );
}
