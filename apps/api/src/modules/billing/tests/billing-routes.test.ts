import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { SubscriptionPlanCode, SubscriptionStatus } from "@prisma/client";
import { canPurchaseBoost, isPlanUpgrade, signBillingWebhookPayload } from "@platform/billing";
import { prisma, resetDatabaseForTests } from "@platform/database";
import { searchBusinesses } from "@platform/discovery";
import { createApp } from "../../../app";

test.beforeEach(async () => {
  await resetDatabaseForTests();
});

async function login(app: Awaited<ReturnType<typeof createApp>>, email: string, password: string) {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/sessions",
    payload: { email, password }
  });

  return response.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

async function registerClient(app: Awaited<ReturnType<typeof createApp>>, suffix: string) {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register/client",
    payload: {
      fullName: `Cliente Billing ${suffix}`,
      cpf: suffix === "A" ? "529.982.247-25" : "111.444.777-35",
      email: `cliente-billing-${suffix.toLowerCase()}@example.com`,
      phone: suffix === "A" ? "11990333333" : "11990444444",
      birthDate: "1990-04-12",
      password: "Senha123!"
    }
  });

  return response.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

function buildWebhookPayload(paymentId: string) {
  return JSON.stringify({
    id: `evt_${randomUUID()}`,
    type: "invoice.payment_succeeded",
    apiVersion: "2026-04-17",
    createdAt: new Date().toISOString(),
    data: {
      paymentId,
      paidAt: new Date().toISOString()
    }
  });
}

test("plan upgrade and boost eligibility helpers enforce billing rules", () => {
  assert.equal(isPlanUpgrade(SubscriptionPlanCode.FREE, SubscriptionPlanCode.PRO_MONTHLY), true);
  assert.equal(isPlanUpgrade(SubscriptionPlanCode.PRO_MONTHLY, SubscriptionPlanCode.PRO_YEARLY), true);
  assert.equal(isPlanUpgrade(SubscriptionPlanCode.PRO_YEARLY, SubscriptionPlanCode.PRO_MONTHLY), false);

  assert.equal(canPurchaseBoost({
    planCode: SubscriptionPlanCode.PRO_MONTHLY,
    status: SubscriptionStatus.ACTIVE
  }), true);

  assert.equal(canPurchaseBoost({
    planCode: SubscriptionPlanCode.FREE,
    status: SubscriptionStatus.ACTIVE
  }), false);

  assert.equal(canPurchaseBoost({
    planCode: SubscriptionPlanCode.PRO_YEARLY,
    status: SubscriptionStatus.PAST_DUE
  }), false);
});

test("business can create subscription checkout, confirm via webhook and activate boost", async () => {
  const app = await createApp();
  const businessCookies = await login(app, "negocio-seed@plataforma.local", "Business123!");

  const plansResponse = await app.inject({
    method: "GET",
    url: "/api/v1/plans"
  });

  assert.equal(plansResponse.statusCode, 200);
  assert.equal(plansResponse.json().data.some((plan: { code: string }) => plan.code === "pro_monthly"), true);

  const beforeBoostSearch = await searchBusinesses({ query: "negocio" });
  const baseRanking = beforeBoostSearch[0]?.rankingScore ?? 0;

  const checkout = await app.inject({
    method: "POST",
    url: "/api/v1/subscriptions",
    headers: { cookie: businessCookies },
    payload: { planCode: "pro_monthly" }
  });

  assert.equal(checkout.statusCode, 201, `Subscription checkout: ${checkout.body}`);
  const checkoutBody = checkout.json().data;
  assert.equal(checkoutBody.subscription.status, "incomplete");
  assert.equal(checkoutBody.checkout.pendingPaymentIds.length >= 1, true);

  const currentBeforeWebhook = await app.inject({
    method: "GET",
    url: "/api/v1/subscriptions/current",
    headers: { cookie: businessCookies }
  });

  assert.equal(currentBeforeWebhook.statusCode, 200);
  assert.equal(currentBeforeWebhook.json().data.status, "incomplete");

  const subscriptionWebhookPayload = buildWebhookPayload(checkoutBody.checkout.pendingPaymentIds[0]);
  const subscriptionSignature = signBillingWebhookPayload(subscriptionWebhookPayload);

  const webhookResponse = await app.inject({
    method: "POST",
    url: "/api/v1/webhooks/billing-provider",
    headers: {
      "x-billing-timestamp": subscriptionSignature.timestamp,
      "x-billing-signature": subscriptionSignature.signature,
      "content-type": "application/json"
    },
    payload: subscriptionWebhookPayload
  });

  assert.equal(webhookResponse.statusCode, 200, `Webhook: ${webhookResponse.body}`);
  assert.equal(webhookResponse.json().data.received, true);

  const currentAfterWebhook = await app.inject({
    method: "GET",
    url: "/api/v1/subscriptions/current",
    headers: { cookie: businessCookies }
  });

  assert.equal(currentAfterWebhook.statusCode, 200);
  assert.equal(currentAfterWebhook.json().data.status, "active");
  assert.equal(currentAfterWebhook.json().data.planCode, "pro_monthly");

  const providerOverview = await app.inject({
    method: "GET",
    url: "/api/v1/provider-dashboard/overview",
    headers: { cookie: businessCookies }
  });

  assert.equal(providerOverview.statusCode, 200, `Provider overview: ${providerOverview.body}`);
  assert.equal(providerOverview.json().data.subscriptionStatus, "active");

  const boostCheckout = await app.inject({
    method: "POST",
    url: "/api/v1/boosts",
    headers: { cookie: businessCookies },
    payload: { durationDays: 7 }
  });

  assert.equal(boostCheckout.statusCode, 201, `Boost checkout: ${boostCheckout.body}`);
  const boostBody = boostCheckout.json().data;
  assert.equal(boostBody.checkout.pendingPaymentIds.length, 1);

  const boostWebhookPayload = buildWebhookPayload(boostBody.checkout.pendingPaymentIds[0]);
  const boostSignature = signBillingWebhookPayload(boostWebhookPayload);

  const boostWebhook = await app.inject({
    method: "POST",
    url: "/api/v1/webhooks/billing-provider",
    headers: {
      "x-billing-timestamp": boostSignature.timestamp,
      "x-billing-signature": boostSignature.signature,
      "content-type": "application/json"
    },
    payload: boostWebhookPayload
  });

  assert.equal(boostWebhook.statusCode, 200, `Boost webhook: ${boostWebhook.body}`);

  const boosts = await app.inject({
    method: "GET",
    url: "/api/v1/boosts/current",
    headers: { cookie: businessCookies }
  });

  assert.equal(boosts.statusCode, 200, `Boosts current: ${boosts.body}`);
  assert.equal(boosts.json().data.some((item: { status: string }) => item.status === "active"), true);

  const afterBoostSearch = await searchBusinesses({ query: "negocio" });
  const boostedRanking = afterBoostSearch[0]?.rankingScore ?? 0;
  assert.equal(boostedRanking > baseRanking, true);

  const cancelSubscription = await app.inject({
    method: "POST",
    url: "/api/v1/subscriptions/current/cancel",
    headers: { cookie: businessCookies }
  });

  assert.equal(cancelSubscription.statusCode, 200, `Cancel subscription: ${cancelSubscription.body}`);
  assert.equal(cancelSubscription.json().data.cancelAtPeriodEnd, true);

  const invoiceCount = await prisma.invoice.count();
  const paymentCount = await prisma.payment.count();
  assert.equal(invoiceCount >= 2, true);
  assert.equal(paymentCount >= 2, true);

  await app.close();
});

test("client cannot access business billing routes", async () => {
  const app = await createApp();
  const clientCookies = await registerClient(app, "A");

  const response = await app.inject({
    method: "GET",
    url: "/api/v1/subscriptions/current",
    headers: { cookie: clientCookies }
  });

  assert.equal(response.statusCode, 403);
  await app.close();
});
