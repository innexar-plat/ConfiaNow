import assert from "node:assert/strict";
import test from "node:test";
import { NotificationType } from "@prisma/client";
import { prisma, resetDatabaseForTests } from "@platform/database";
import { isNotificationTypeEnabled } from "@platform/notifications";
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
      fullName: `Cliente Notifications ${suffix}`,
      cpf: suffix === "A" ? "529.982.247-25" : "111.444.777-35",
      email: `cliente-notifications-${suffix.toLowerCase()}@example.com`,
      phone: suffix === "A" ? "11990111111" : "11990222222",
      birthDate: "1991-02-12",
      password: "Senha123!"
    }
  });

  return response.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

test("isNotificationTypeEnabled respects category preferences", () => {
  assert.equal(isNotificationTypeEnabled({
    notificationType: NotificationType.LEAD_CREATED,
    inAppEnabled: true,
    leadAlertsEnabled: true,
    reviewAlertsEnabled: true,
    marketingEnabled: false
  }), true);

  assert.equal(isNotificationTypeEnabled({
    notificationType: NotificationType.LEAD_CREATED,
    inAppEnabled: true,
    leadAlertsEnabled: false,
    reviewAlertsEnabled: true,
    marketingEnabled: false
  }), false);

  assert.equal(isNotificationTypeEnabled({
    notificationType: NotificationType.CAMPAIGN_ANNOUNCEMENT,
    inAppEnabled: true,
    leadAlertsEnabled: true,
    reviewAlertsEnabled: true,
    marketingEnabled: false
  }), false);
});

test("lead creation notifies business and business can mark notification as read", async () => {
  const app = await createApp();
  const businessCookies = await login(app, "negocio-seed@plataforma.local", "Business123!");
  const clientCookies = await registerClient(app, "A");

  const lead = await app.inject({
    method: "POST",
    url: "/api/v1/leads",
    headers: { cookie: clientCookies },
    payload: {
      businessSlug: "negocio-seed",
      subject: "Preciso de orcamento para sala comercial",
      message: "Estou abrindo uma sala de atendimento e preciso de pintura interna completa."
    }
  });

  assert.equal(lead.statusCode, 201, `Lead criado: ${lead.body}`);

  const list = await app.inject({
    method: "GET",
    url: "/api/v1/notifications",
    headers: { cookie: businessCookies }
  });

  assert.equal(list.statusCode, 200, `Notifications: ${list.body}`);
  assert.ok(list.json().data.length >= 1);
  assert.equal(list.json().meta.unreadCount >= 1, true);

  const target = list.json().data.find((item: { type: string }) => item.type === "lead_created");
  assert.ok(target?.id, "Notificacao de novo lead nao encontrada");

  const read = await app.inject({
    method: "PATCH",
    url: `/api/v1/notifications/${target.id}/read`,
    headers: { cookie: businessCookies }
  });

  assert.equal(read.statusCode, 200, `Read notification: ${read.body}`);
  assert.equal(read.json().data.isRead, true);

  await app.close();
});

test("client can update preferences and disabled lead alerts stop new lead notifications", async () => {
  const app = await createApp();
  const businessCookies = await login(app, "negocio-seed@plataforma.local", "Business123!");

  await app.inject({
    method: "PATCH",
    url: "/api/v1/notification-preferences",
    headers: { cookie: businessCookies },
    payload: {
      leadAlertsEnabled: false
    }
  });

  const preferences = await app.inject({
    method: "GET",
    url: "/api/v1/notification-preferences",
    headers: { cookie: businessCookies }
  });

  assert.equal(preferences.statusCode, 200, `Preferences: ${preferences.body}`);
  assert.equal(preferences.json().data.leadAlertsEnabled, false);

  const clientCookies = await registerClient(app, "B");

  const lead = await app.inject({
    method: "POST",
    url: "/api/v1/leads",
    headers: { cookie: clientCookies },
    payload: {
      businessSlug: "negocio-seed",
      subject: "Orcamento para casa nova",
      message: "Gostaria de pintar cozinha e area externa nas proximas semanas."
    }
  });

  assert.equal(lead.statusCode, 201, `Lead criado: ${lead.body}`);

  const notifications = await app.inject({
    method: "GET",
    url: "/api/v1/notifications",
    headers: { cookie: businessCookies }
  });

  assert.equal(notifications.statusCode, 200);
  assert.equal(notifications.json().data.some((item: { type: string; metadata: { subject?: string } | null }) => {
    return item.type === "lead_created" && item.metadata?.subject === "Orcamento para casa nova";
  }), false);

  await app.close();
});

test("admin can trigger campaign and non-admin is forbidden", async () => {
  const app = await createApp();
  const adminCookies = await login(app, "admin@plataforma.local", "Admin12345!");
  const businessCookies = await login(app, "negocio-seed@plataforma.local", "Business123!");

  const forbidden = await app.inject({
    method: "POST",
    url: "/api/v1/admin/campaigns/trigger",
    headers: { cookie: businessCookies },
    payload: {
      campaignCode: "reactivation-q2",
      title: "Campanha teste",
      body: "Corpo da campanha com conteudo minimo valido"
    }
  });

  assert.equal(forbidden.statusCode, 403);

  const campaign = await app.inject({
    method: "POST",
    url: "/api/v1/admin/campaigns/trigger",
    headers: { cookie: adminCookies },
    payload: {
      campaignCode: "reactivation-q2",
      title: "Campanha teste",
      body: "Corpo da campanha com conteudo minimo valido",
      targetRole: "business"
    }
  });

  assert.equal(campaign.statusCode, 201, `Campaign trigger: ${campaign.body}`);
  assert.equal(campaign.json().data.status, "completed");

  const campaignRun = await prisma.campaignRun.findFirst({ where: { campaignCode: "reactivation-q2" } });
  assert.ok(campaignRun?.id);

  await app.close();
});
