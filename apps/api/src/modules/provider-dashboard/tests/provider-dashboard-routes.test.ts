import assert from "node:assert/strict";
import test from "node:test";
import { resetDatabaseForTests } from "@platform/database";
import { computeProviderPendingActions } from "@platform/provider-dashboard";
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
      fullName: `Cliente Provider ${suffix}`,
      cpf: suffix === "A" ? "529.982.247-25" : "111.444.777-35",
      email: `cliente-provider-${suffix.toLowerCase()}@example.com`,
      phone: suffix === "A" ? "11990001111" : "11990002222",
      birthDate: "1991-02-12",
      password: "Senha123!"
    }
  });

  return response.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

test("computeProviderPendingActions prioritizes profile and sla gaps", () => {
  const actions = computeProviderPendingActions({
    verificationStatus: "pending_review",
    subscriptionStatus: "not_enabled",
    isProfilePublished: false,
    servicesCount: 0,
    portfolioCount: 0,
    openLeadsCount: 2,
    lateLeadsCount: 1,
    approvedReviewsCount: 0,
    pendingItems: ["Adicionar mais servicos", "Completar portfolio"]
  });

  assert.equal(actions[0]?.code, "complete-verification");
  assert.ok(actions.some((item) => item.code === "recover-sla"));
  assert.ok(actions.some((item) => item.code === "add-services"));
});

test("business can read provider dashboard overview, recommendations, performance and pending actions", async () => {
  const app = await createApp();
  const businessCookies = await login(app, "negocio-seed@plataforma.local", "Business123!");
  const clientCookies = await registerClient(app, "A");

  const createLead = await app.inject({
    method: "POST",
    url: "/api/v1/leads",
    headers: { cookie: clientCookies },
    payload: {
      businessSlug: "negocio-seed",
      subject: "Pintura comercial urgente",
      message: "Precisamos de proposta para pintura interna de escritorio ainda esta semana."
    }
  });

  assert.equal(createLead.statusCode, 201, `Lead criado: ${createLead.body}`);

  const overview = await app.inject({
    method: "GET",
    url: "/api/v1/provider-dashboard/overview",
    headers: { cookie: businessCookies }
  });

  assert.equal(overview.statusCode, 200, `Overview: ${overview.body}`);
  assert.equal(overview.json().data.businessSlug, "negocio-seed");
  assert.equal(overview.json().data.subscriptionStatus, "not_enabled");
  assert.equal(overview.json().data.kpis.openLeadsCount >= 1, true);

  const recommendations = await app.inject({
    method: "GET",
    url: "/api/v1/provider-dashboard/recommendations",
    headers: { cookie: businessCookies }
  });

  assert.equal(recommendations.statusCode, 200, `Recommendations: ${recommendations.body}`);
  assert.ok(Array.isArray(recommendations.json().data));
  assert.ok(recommendations.json().data.length >= 1);

  const performance = await app.inject({
    method: "GET",
    url: "/api/v1/provider-dashboard/performance",
    headers: { cookie: businessCookies }
  });

  assert.equal(performance.statusCode, 200, `Performance: ${performance.body}`);
  assert.ok(Array.isArray(performance.json().data.recentSnapshots));
  assert.ok(performance.json().data.recentSnapshots.length >= 1);

  const pendingActions = await app.inject({
    method: "GET",
    url: "/api/v1/provider-dashboard/pending-actions",
    headers: { cookie: businessCookies }
  });

  assert.equal(pendingActions.statusCode, 200, `Pending actions: ${pendingActions.body}`);
  assert.ok(Array.isArray(pendingActions.json().data));
  assert.ok(pendingActions.json().data.length >= 1);

  await app.close();
});

test("non-business users cannot access provider dashboard endpoints", async () => {
  const app = await createApp();
  const adminCookies = await login(app, "admin@plataforma.local", "Admin12345!");
  const clientCookies = await registerClient(app, "B");

  const adminOverview = await app.inject({
    method: "GET",
    url: "/api/v1/provider-dashboard/overview",
    headers: { cookie: adminCookies }
  });

  assert.equal(adminOverview.statusCode, 403);

  const clientOverview = await app.inject({
    method: "GET",
    url: "/api/v1/provider-dashboard/overview",
    headers: { cookie: clientCookies }
  });

  assert.equal(clientOverview.statusCode, 403);

  await app.close();
});
