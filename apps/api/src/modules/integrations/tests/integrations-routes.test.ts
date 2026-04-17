import assert from "node:assert/strict";
import test from "node:test";
import { BackgroundJobStatus, IntegrationProvider } from "@prisma/client";
import { prisma, resetDatabaseForTests } from "@platform/database";
import { createApp } from "../../../app";

test.beforeEach(async () => {
  await resetDatabaseForTests();
});

async function loginAdmin(app: Awaited<ReturnType<typeof createApp>>) {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/sessions",
    payload: { email: "admin@plataforma.local", password: "Admin12345!" }
  });

  return response.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

test("POST /webhooks/verification-provider creates event and job", async () => {
  const app = await createApp();

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/webhooks/verification-provider",
    headers: { "x-provider-signature": "sig-verification-123" },
    payload: {
      eventType: "verification.approved",
      providerEventId: "evt-verification-1",
      data: { userId: "user-1" }
    }
  });

  assert.equal(response.statusCode, 200, response.body);
  const body = response.json().data;
  assert.equal(body.accepted, true);

  const event = await prisma.integrationEvent.findUnique({ where: { providerEventId: "evt-verification-1" } });
  assert.ok(event);
  assert.equal(event?.provider, IntegrationProvider.VERIFICATION_PROVIDER);

  const jobs = await prisma.backgroundJob.findMany({ where: { integrationEventId: event?.id } });
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0]?.status, BackgroundJobStatus.PENDING);
});

test("POST /webhooks/verification-provider handles duplicate provider event id", async () => {
  const app = await createApp();

  const payload = {
    eventType: "verification.approved",
    providerEventId: "evt-duplicate-1",
    data: { userId: "user-1" }
  };

  const first = await app.inject({
    method: "POST",
    url: "/api/v1/webhooks/verification-provider",
    headers: { "x-provider-signature": "sig-1" },
    payload
  });

  const second = await app.inject({
    method: "POST",
    url: "/api/v1/webhooks/verification-provider",
    headers: { "x-provider-signature": "sig-2" },
    payload
  });

  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 200);

  const events = await prisma.integrationEvent.findMany({ where: { providerEventId: "evt-duplicate-1" } });
  assert.equal(events.length, 1);

  const deliveries = await prisma.webhookDelivery.findMany({ where: { integrationEventId: events[0]!.id } });
  assert.equal(deliveries.length, 2);
});

test("GET /admin/integrations/status requires authentication", async () => {
  const app = await createApp();

  const response = await app.inject({
    method: "GET",
    url: "/api/v1/admin/integrations/status"
  });

  assert.equal(response.statusCode, 401);
});

test("GET /admin/integrations/status returns provider overview for admin", async () => {
  const app = await createApp();
  const adminCookie = await loginAdmin(app);

  await app.inject({
    method: "POST",
    url: "/api/v1/webhooks/email-provider",
    headers: { "x-provider-signature": "sig-email" },
    payload: {
      eventType: "email.delivered",
      providerEventId: "evt-email-1",
      data: { messageId: "msg-1" }
    }
  });

  const response = await app.inject({
    method: "GET",
    url: "/api/v1/admin/integrations/status",
    headers: { cookie: adminCookie }
  });

  assert.equal(response.statusCode, 200, response.body);
  const body = response.json();
  assert.equal(Array.isArray(body.data), true);
  assert.equal(body.data.length, 3);
  assert.equal(body.meta.providerCount, 3);
});

test("GET /admin/jobs returns paginated jobs for admin", async () => {
  const app = await createApp();
  const adminCookie = await loginAdmin(app);

  await app.inject({
    method: "POST",
    url: "/api/v1/webhooks/storage-provider",
    headers: { "x-provider-signature": "sig-storage" },
    payload: {
      eventType: "storage.file.uploaded",
      providerEventId: "evt-storage-1",
      data: { fileId: "file-1" }
    }
  });

  const response = await app.inject({
    method: "GET",
    url: "/api/v1/admin/jobs?page=1&limit=20",
    headers: { cookie: adminCookie }
  });

  assert.equal(response.statusCode, 200, response.body);
  const body = response.json();
  assert.equal(Array.isArray(body.data), true);
  assert.ok(body.meta.total >= 1);
});

test("POST /admin/jobs/:id/retry requeues failed job", async () => {
  const app = await createApp();
  const adminCookie = await loginAdmin(app);
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@plataforma.local" } });

  const failedJob = await prisma.backgroundJob.create({
    data: {
      provider: IntegrationProvider.EMAIL_PROVIDER,
      jobType: "email.delivery.failed",
      status: BackgroundJobStatus.FAILED,
      attemptCount: 2,
      maxAttempts: 5,
      lastError: "SMTP_TIMEOUT"
    }
  });

  const response = await app.inject({
    method: "POST",
    url: `/api/v1/admin/jobs/${failedJob.id}/retry`,
    headers: { cookie: adminCookie },
    payload: { reason: "manual retry from dashboard" }
  });

  assert.equal(response.statusCode, 200, response.body);
  const body = response.json().data;
  assert.equal(body.job.status, BackgroundJobStatus.PENDING);
  assert.equal(body.retry.sourceId, failedJob.id);
  assert.equal(body.retry.actorUserId, admin.id);
});
