import assert from "node:assert/strict";
import test from "node:test";
import { resetDatabaseForTests } from "@platform/database";
import { createApp } from "../../../app";

test.beforeEach(async () => {
  await resetDatabaseForTests();
});

async function loginSeedBusiness(app: Awaited<ReturnType<typeof createApp>>) {
  const login = await app.inject({
    method: "POST",
    url: "/api/v1/auth/sessions",
    payload: {
      email: "negocio-seed@plataforma.local",
      password: "Business123!"
    }
  });

  return login.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

async function registerClientAndGetCookies(app: Awaited<ReturnType<typeof createApp>>) {
  const register = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register/client",
    payload: {
      fullName: "Cliente Lead Test",
      cpf: "529.982.247-25",
      email: "lead-client@example.com",
      phone: "11998887766",
      birthDate: "1993-05-10",
      password: "Senha123!"
    }
  });

  return register.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

test("client can create a lead and business sees it in inbox", async () => {
  const app = await createApp();
  const clientCookies = await registerClientAndGetCookies(app);
  const businessCookies = await loginSeedBusiness(app);

  const created = await app.inject({
    method: "POST",
    url: "/api/v1/leads",
    headers: { cookie: clientCookies },
    payload: {
      businessSlug: "negocio-seed",
      subject: "Preciso de pintura para apartamento",
      message: "Apartamento de 2 quartos em Orlando, preciso de orcamento para pintura interna completa."
    }
  });

  assert.equal(created.statusCode, 201);

  const inbox = await app.inject({
    method: "GET",
    url: "/api/v1/me/leads/inbox",
    headers: { cookie: businessCookies }
  });

  assert.equal(inbox.statusCode, 200);
  assert.equal(inbox.json().data.some((lead: { subject: string }) => lead.subject === "Preciso de pintura para apartamento"), true);

  await app.close();
});

test("business can respond to a lead and release contact", async () => {
  const app = await createApp();
  const clientCookies = await registerClientAndGetCookies(app);
  const businessCookies = await loginSeedBusiness(app);

  const created = await app.inject({
    method: "POST",
    url: "/api/v1/leads",
    headers: { cookie: clientCookies },
    payload: {
      businessSlug: "negocio-seed",
      subject: "Orcamento para fachada",
      message: "Gostaria de pintar a fachada da minha casa ainda este mes."
    }
  });

  const leadId = created.json().data.id;

  const responded = await app.inject({
    method: "PATCH",
    url: `/api/v1/leads/${leadId}/status`,
    headers: { cookie: businessCookies },
    payload: {
      status: "responded",
      note: "Lead priorizado",
      responseMessage: "Recebemos sua solicitacao e vamos responder com orcamento ainda hoje."
    }
  });

  assert.equal(responded.statusCode, 200);
  assert.equal(responded.json().data.status, "responded");

  const released = await app.inject({
    method: "POST",
    url: `/api/v1/leads/${leadId}/contact-release`,
    headers: { cookie: businessCookies },
    payload: { note: "Contato liberado apos resposta inicial" }
  });

  assert.equal(released.statusCode, 201);

  const detail = await app.inject({
    method: "GET",
    url: `/api/v1/leads/${leadId}`,
    headers: { cookie: clientCookies }
  });

  assert.equal(detail.statusCode, 200);
  assert.equal(detail.json().data.contactReleases.length, 1);
  assert.equal(detail.json().data.messages.some((message: { senderRole: string }) => message.senderRole === "business"), true);

  await app.close();
});