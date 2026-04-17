import assert from "node:assert/strict";
import test from "node:test";
import { resetDatabaseForTests } from "@platform/database";
import { createApp } from "../../../app";

test.beforeEach(async () => {
  await resetDatabaseForTests();
});

async function registerClient(app: Awaited<ReturnType<typeof createApp>>, suffix: string) {
  const cpfMap: Record<string, string> = {
    A: "529.982.247-25",
    B: "111.444.777-35",
    C: "222.555.888-04"
  };
  const phoneMap: Record<string, string> = {
    A: "11991112222",
    B: "11993334444",
    C: "11995556666"
  };

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register/client",
    payload: {
      fullName: `Cliente Moderation ${suffix}`,
      cpf: cpfMap[suffix] ?? "529.982.247-25",
      email: `cliente-moderation-${suffix.toLowerCase()}@example.com`,
      phone: phoneMap[suffix] ?? "11991112222",
      birthDate: "1992-03-15",
      password: "Senha123!"
    }
  });

  return response.cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

async function loginAdmin(app: Awaited<ReturnType<typeof createApp>>) {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/sessions",
    payload: { email: "admin@plataforma.local", password: "Admin12345!" }
  });

  return response.cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

test("moderation case full lifecycle: create, list, resolve", async () => {
  const app = await createApp();
  const clientCookies = await registerClient(app, "A");
  const adminCookies = await loginAdmin(app);

  // Cliente cria uma denuncia
  const createReport = await app.inject({
    method: "POST",
    url: "/api/v1/admin/reports",
    headers: { cookie: clientCookies },
    payload: {
      type: "REPORT_BUSINESS",
      targetType: "business_profile",
      targetId: "00000000-0000-4000-a000-000000000001",
      description: "Este negocio esta cobrando taxas indevidas dos clientes."
    }
  });

  assert.equal(createReport.statusCode, 201, `Criar denuncia: ${createReport.body}`);
  const caseId = createReport.json().data.id as string;
  assert.equal(createReport.json().data.status, "OPEN");
  assert.equal(createReport.json().data.type, "REPORT_BUSINESS");

  // Admin lista reports abertos
  const listReports = await app.inject({
    method: "GET",
    url: "/api/v1/admin/reports?status=OPEN",
    headers: { cookie: adminCookies }
  });

  assert.equal(listReports.statusCode, 200, `Listar reports: ${listReports.body}`);
  assert.ok(listReports.json().data.length >= 1);
  assert.ok(listReports.json().meta.total >= 1);

  // Admin resolve o caso
  const resolveReport = await app.inject({
    method: "POST",
    url: `/api/v1/admin/reports/${caseId}/resolve`,
    headers: { cookie: adminCookies },
    payload: {
      decision: "resolved",
      note: "Verificado e resolvido com o negocio."
    }
  });

  assert.equal(resolveReport.statusCode, 200, `Resolver denuncia: ${resolveReport.body}`);
  assert.equal(resolveReport.json().data.status, "RESOLVED");
  assert.equal(resolveReport.json().data.decisions.length, 1);
  assert.equal(resolveReport.json().data.decisions[0].decision, "resolved");

  // Caso resolvido nao pode ser resolvido novamente
  const resolveAgain = await app.inject({
    method: "POST",
    url: `/api/v1/admin/reports/${caseId}/resolve`,
    headers: { cookie: adminCookies },
    payload: { decision: "dismissed" }
  });

  assert.equal(resolveAgain.statusCode, 422, "Nao pode resolver caso ja fechado");
});

test("non-admin cannot list or resolve reports", async () => {
  const app = await createApp();
  const clientCookies = await registerClient(app, "B");

  // Cliente cria uma denuncia (permitido)
  const createReport = await app.inject({
    method: "POST",
    url: "/api/v1/admin/reports",
    headers: { cookie: clientCookies },
    payload: {
      type: "SPAM",
      targetType: "review",
      targetId: "00000000-0000-4000-a000-000000000002",
      description: "Esta review e claramente falsa e foi comprada pelo negocio."
    }
  });

  assert.equal(createReport.statusCode, 201, `Create report as client: ${createReport.body}`);
  const caseId = createReport.json().data.id as string;

  // Cliente nao pode listar reports
  const listReports = await app.inject({
    method: "GET",
    url: "/api/v1/admin/reports",
    headers: { cookie: clientCookies }
  });

  assert.equal(listReports.statusCode, 403, "Cliente nao pode listar reports");

  // Cliente nao pode resolver report
  const resolveReport = await app.inject({
    method: "POST",
    url: `/api/v1/admin/reports/${caseId}/resolve`,
    headers: { cookie: clientCookies },
    payload: { decision: "dismissed" }
  });

  assert.equal(resolveReport.statusCode, 403, "Cliente nao pode resolver reports");
});

test("admin can list pending verifications", async () => {
  const app = await createApp();
  const adminCookies = await loginAdmin(app);

  // Registra um cliente para gerar verification request
  await registerClient(app, "C");

  const listVerifications = await app.inject({
    method: "GET",
    url: "/api/v1/admin/verifications",
    headers: { cookie: adminCookies }
  });

  assert.equal(listVerifications.statusCode, 200, `Listar verificacoes: ${listVerifications.body}`);
  assert.ok(Array.isArray(listVerifications.json().data));
  assert.ok(typeof listVerifications.json().meta.total === "number");
});

test("admin can list reviews pending via /admin/reviews/pending alias", async () => {
  const app = await createApp();
  const adminCookies = await loginAdmin(app);

  const listReviews = await app.inject({
    method: "GET",
    url: "/api/v1/admin/reviews/pending",
    headers: { cookie: adminCookies }
  });

  assert.equal(listReviews.statusCode, 200, `Admin reviews pending: ${listReviews.body}`);
  assert.ok(Array.isArray(listReviews.json().data));
});

test("non-admin cannot access admin verifications or admin reviews", async () => {
  const app = await createApp();
  const clientCookies = await registerClient(app, "A");

  const verifications = await app.inject({
    method: "GET",
    url: "/api/v1/admin/verifications",
    headers: { cookie: clientCookies }
  });

  assert.equal(verifications.statusCode, 403, "Cliente nao pode listar verificacoes admin");

  const reviews = await app.inject({
    method: "GET",
    url: "/api/v1/admin/reviews/pending",
    headers: { cookie: clientCookies }
  });

  assert.equal(reviews.statusCode, 403, "Cliente nao pode listar reviews pendentes admin");
});

test("admin can get paginated audit log", async () => {
  const app = await createApp();
  const adminCookies = await loginAdmin(app);

  const auditLog = await app.inject({
    method: "GET",
    url: "/api/v1/admin/audit-log?page=1&limit=5",
    headers: { cookie: adminCookies }
  });

  assert.equal(auditLog.statusCode, 200, `Audit log: ${auditLog.body}`);
  assert.ok(Array.isArray(auditLog.json().data));
  assert.ok(typeof auditLog.json().meta.total === "number");
  assert.equal(auditLog.json().meta.limit, 5);
});
