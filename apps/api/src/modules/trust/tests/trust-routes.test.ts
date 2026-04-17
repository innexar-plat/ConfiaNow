import assert from "node:assert/strict";
import test from "node:test";
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

test("public trust endpoints expose levels and score for a published business", async () => {
  const app = await createApp();
  const profile = await prisma.businessProfile.findFirstOrThrow({ where: { slug: "negocio-seed" } });

  const levels = await app.inject({ method: "GET", url: "/api/v1/trust/badges" });
  const score = await app.inject({ method: "GET", url: `/api/v1/businesses/${profile.id}/trust-score` });

  assert.equal(levels.statusCode, 200);
  assert.equal(levels.json().data.length, 3);
  assert.equal(score.statusCode, 200);
  assert.equal(score.json().data.badgeCode, "silver");
  assert.equal(score.json().data.score >= 70, true);

  await app.close();
});

test("business reads badge status and admin can suspend and restore badge", async () => {
  const app = await createApp();
  const businessCookies = await login(app, "negocio-seed@plataforma.local", "Business123!");
  const adminCookies = await login(app, "admin@plataforma.local", "Admin12345!");
  const profile = await prisma.businessProfile.findFirstOrThrow({ where: { slug: "negocio-seed" } });

  const status = await app.inject({
    method: "GET",
    url: "/api/v1/me/badge-status",
    headers: { cookie: businessCookies }
  });

  assert.equal(status.statusCode, 200);
  assert.equal(status.json().data.badgeCode, "silver");

  const suspended = await app.inject({
    method: "POST",
    url: `/api/v1/admin/trust/suspend/${profile.id}`,
    headers: { cookie: adminCookies },
    payload: { reason: "Manual trust review" }
  });

  assert.equal(suspended.statusCode, 200);
  assert.equal(suspended.json().data.badgeCode, "none");
  assert.equal(suspended.json().data.isSuspended, true);

  const restored = await app.inject({
    method: "POST",
    url: `/api/v1/admin/trust/restore/${profile.id}`,
    headers: { cookie: adminCookies },
    payload: { reason: "Trust restored after review" }
  });

  assert.equal(restored.statusCode, 200);
  assert.equal(restored.json().data.badgeCode, "silver");
  assert.equal(restored.json().data.isSuspended, false);

  await app.close();
});