import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BillingPlanSelector } from "./billing-plan-selector";

test("billing plan selector renders checkout actions and recommended badge", () => {
  const html = renderToStaticMarkup(
    <BillingPlanSelector
      plans={[
        {
          code: "pro_monthly",
          name: "Pro Monthly",
          description: "Plano mensal",
          interval: "month",
          priceCents: 9900,
          currency: "USD",
          verificationFeeCents: 4900,
          boostPriceDailyCents: 700,
          recommended: true,
          features: ["boost purchases"]
        },
        {
          code: "pro_yearly",
          name: "Pro Yearly",
          description: "Plano anual",
          interval: "year",
          priceCents: 99000,
          currency: "USD",
          verificationFeeCents: 4900,
          boostPriceDailyCents: 700,
          recommended: false,
          features: ["commercial priority"]
        }
      ]}
      currentSubscription={{
        id: null,
        planCode: "free",
        planName: "Free",
        status: "canceled",
        interval: "month",
        priceCents: 0,
        currency: "USD",
        cancelAtPeriodEnd: false,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        checkoutReference: null,
        hasActiveBenefits: false
      }}
    />
  );

  assert.match(html, /Pro Monthly/);
  assert.match(html, /recomendado/);
  assert.match(html, /Assinar agora/);
});

test("billing plan selector marks current active plan as disabled", () => {
  const html = renderToStaticMarkup(
    <BillingPlanSelector
      plans={[
        {
          code: "pro_monthly",
          name: "Pro Monthly",
          description: "Plano mensal",
          interval: "month",
          priceCents: 9900,
          currency: "USD",
          verificationFeeCents: 4900,
          boostPriceDailyCents: 700,
          recommended: false,
          features: ["priority placement"]
        },
        {
          code: "free",
          name: "Free",
          description: "Plano gratis",
          interval: "month",
          priceCents: 0,
          currency: "USD",
          verificationFeeCents: 0,
          boostPriceDailyCents: 0,
          recommended: false,
          features: []
        }
      ]}
      currentSubscription={{
        id: "sub-1",
        planCode: "pro_monthly",
        planName: "Pro Monthly",
        status: "active",
        interval: "month",
        priceCents: 9900,
        currency: "USD",
        cancelAtPeriodEnd: false,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        checkoutReference: null,
        hasActiveBenefits: true
      }}
    />
  );

  assert.match(html, /Plano atual/);
  assert.match(html, /disabled/);
  assert.doesNotMatch(html, /Free/);
});

test("billing plan selector uses plan change action for paid subscription change", () => {
  const html = renderToStaticMarkup(
    <BillingPlanSelector
      plans={[
        {
          code: "pro_yearly",
          name: "Pro Yearly",
          description: "Plano anual",
          interval: "year",
          priceCents: 99000,
          currency: "USD",
          verificationFeeCents: 4900,
          boostPriceDailyCents: 700,
          recommended: false,
          features: ["commercial priority"]
        }
      ]}
      currentSubscription={{
        id: "sub-2",
        planCode: "pro_monthly",
        planName: "Pro Monthly",
        status: "active",
        interval: "month",
        priceCents: 9900,
        currency: "USD",
        cancelAtPeriodEnd: false,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        checkoutReference: null,
        hasActiveBenefits: true
      }}
    />
  );

  assert.match(html, /Alterar plano/);
  assert.match(html, /action="\/auth\/subscriptions\/current"/);
});
