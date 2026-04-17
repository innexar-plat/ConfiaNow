import test from "node:test";
import assert from "node:assert/strict";
import { resetDatabaseForTests } from "@platform/database";
import { createApp } from "../../../app";

test.beforeEach(async () => {
  await resetDatabaseForTests();
});

test("GET /api/v1/config/public returns platform metadata", async () => {
  const app = await createApp();

  const response = await app.inject({
    method: "GET",
    url: "/api/v1/config/public"
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().data.defaultLocale, "pt-BR");

  await app.close();
});

test("GET /api/v1/me requires authentication", async () => {
  const app = await createApp();

  const response = await app.inject({
    method: "GET",
    url: "/api/v1/me"
  });

  assert.equal(response.statusCode, 401);

  await app.close();
});

test("GET /api/v1/me returns mock current user for demo role", async () => {
  const app = await createApp();

  const response = await app.inject({
    method: "GET",
    url: "/api/v1/me",
    headers: {
      "x-demo-role": "business"
    }
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().data.role, "business");

  await app.close();
});

test("PATCH /api/v1/admin/settings updates settings for admin", async () => {
  const app = await createApp();

  const response = await app.inject({
    method: "PATCH",
    url: "/api/v1/admin/settings",
    headers: {
      "x-demo-role": "admin"
    },
    payload: {
      publicSupportEmail: "suporte@plataforma.com"
    }
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().data.publicSupportEmail, "suporte@plataforma.com");

  await app.close();
});

test("GET /api/v1/admin/audit-logs denies non-admin users", async () => {
  const app = await createApp();

  const response = await app.inject({
    method: "GET",
    url: "/api/v1/admin/audit-logs",
    headers: {
      "x-demo-role": "client"
    }
  });

  assert.equal(response.statusCode, 403);

  await app.close();
});
