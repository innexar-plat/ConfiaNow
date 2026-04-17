import assert from "node:assert/strict";
import test from "node:test";
import { AnalyticsEventType, ModerationCaseType, ReviewStatus } from "@prisma/client";
import { recordAnalyticsEvent } from "@platform/analytics";
import { prisma, resetDatabaseForTests } from "@platform/database";
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
      fullName: `Cliente Analytics ${suffix}`,
      cpf: suffix === "A" ? "529.982.247-25" : "111.444.777-35",
      email: `cliente-analytics-${suffix.toLowerCase()}@example.com`,
      phone: suffix === "A" ? "11990555555" : "11990666666",
      birthDate: "1990-04-12",
      password: "Senha123!"
    }
  });

  return response.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

test("admin and business analytics endpoints expose aggregated reporting", async () => {
  const app = await createApp();
  const adminCookies = await login(app, "admin@plataforma.local", "Admin12345!");
  const businessCookies = await login(app, "negocio-seed@plataforma.local", "Business123!");
  const clientCookies = await registerClient(app, "A");

  const businessProfile = await prisma.businessProfile.findUnique({
    where: { slug: "negocio-seed" },
    select: { id: true }
  });

  assert.ok(businessProfile?.id, "Business profile seed nao encontrado");

  await recordAnalyticsEvent({
    type: AnalyticsEventType.PROFILE_VIEW,
    businessProfileId: businessProfile.id,
    metadata: { source: "test" }
  });
  await recordAnalyticsEvent({
    type: AnalyticsEventType.CONTACT_CLICK,
    businessProfileId: businessProfile.id,
    metadata: { channel: "email", source: "test" }
  });

  const createLead = await app.inject({
    method: "POST",
    url: "/api/v1/leads",
    headers: { cookie: clientCookies },
    payload: {
      businessSlug: "negocio-seed",
      subject: "Pintura externa residencial",
      message: "Preciso pintar a fachada e as grades ainda neste mes."
    }
  });

  assert.equal(createLead.statusCode, 201, `Lead criado: ${createLead.body}`);
  const leadId = createLead.json().data.id as string;

  const clientUser = await prisma.user.findUnique({
    where: { email: "cliente-analytics-a@example.com" },
    select: { id: true }
  });

  assert.ok(clientUser?.id, "Cliente analytics nao encontrado");

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      respondedAt: new Date(),
      contactReleasedAt: new Date()
    }
  });

  await prisma.review.create({
    data: {
      leadId,
      clientUserId: clientUser.id,
      businessProfileId: businessProfile.id,
      status: ReviewStatus.APPROVED,
      rating: 5,
      title: "Servico muito bom",
      comment: "Resposta rapida e execucao organizada.",
      publishedAt: new Date(),
      moderation: {
        create: {
          status: ReviewStatus.APPROVED,
          requestedAt: new Date(Date.now() - 3600000),
          reviewedAt: new Date()
        }
      }
    }
  });

  await prisma.moderationCase.create({
    data: {
      type: ModerationCaseType.REPORT_BUSINESS,
      targetType: "business_profile",
      targetId: businessProfile.id,
      description: "Teste de analytics para reports em aberto."
    }
  });

  const adminOverview = await app.inject({
    method: "GET",
    url: "/api/v1/analytics/admin/overview?days=7",
    headers: { cookie: adminCookies }
  });

  assert.equal(adminOverview.statusCode, 200, `Admin overview: ${adminOverview.body}`);
  assert.equal(adminOverview.json().data.totals.profileViewsCount >= 1, true);
  assert.equal(adminOverview.json().data.totals.leadsCreatedCount >= 1, true);
  assert.equal(adminOverview.json().data.totals.approvedReviewsCount >= 1, true);

  const adminFunnels = await app.inject({
    method: "GET",
    url: "/api/v1/analytics/admin/funnels?days=7",
    headers: { cookie: adminCookies }
  });

  assert.equal(adminFunnels.statusCode, 200, `Admin funnels: ${adminFunnels.body}`);
  assert.equal(adminFunnels.json().data.steps.length, 3);
  assert.equal(adminFunnels.json().data.steps[0].count >= adminFunnels.json().data.steps[2].count, true);

  const businessOverview = await app.inject({
    method: "GET",
    url: "/api/v1/analytics/business/overview?days=7",
    headers: { cookie: businessCookies }
  });

  assert.equal(businessOverview.statusCode, 200, `Business overview: ${businessOverview.body}`);
  assert.equal(businessOverview.json().data.summary.leadsReceivedCount >= 1, true);
  assert.equal(businessOverview.json().data.summary.approvedReviewsCount >= 1, true);

  const businessLeads = await app.inject({
    method: "GET",
    url: "/api/v1/analytics/business/leads?days=7",
    headers: { cookie: businessCookies }
  });

  assert.equal(businessLeads.statusCode, 200, `Business leads: ${businessLeads.body}`);
  assert.equal(businessLeads.json().data.totals.respondedLeadsCount >= 1, true);
  assert.equal(Array.isArray(businessLeads.json().data.topSubjects), true);

  const businessReputation = await app.inject({
    method: "GET",
    url: "/api/v1/analytics/business/reputation?days=7",
    headers: { cookie: businessCookies }
  });

  assert.equal(businessReputation.statusCode, 200, `Business reputation: ${businessReputation.body}`);
  assert.equal(businessReputation.json().data.summary.approvedReviewsCount >= 1, true);

  const businessExport = await app.inject({
    method: "GET",
    url: "/api/v1/analytics/business/export?days=7",
    headers: { cookie: businessCookies }
  });

  assert.equal(businessExport.statusCode, 200, `Business export: ${businessExport.body}`);
  assert.match(String(businessExport.headers["content-type"]), /text\/csv/);
  assert.match(businessExport.body, /section,metric,value/);

  const clientForbidden = await app.inject({
    method: "GET",
    url: "/api/v1/analytics/business/overview",
    headers: { cookie: clientCookies }
  });

  assert.equal(clientForbidden.statusCode, 403);
  await app.close();
});
