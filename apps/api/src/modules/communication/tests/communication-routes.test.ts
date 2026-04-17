import assert from "node:assert/strict";
import test from "node:test";
import { resetDatabaseForTests } from "@platform/database";
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

async function registerClient(app: Awaited<ReturnType<typeof createApp>>) {
  const register = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register/client",
    payload: {
      fullName: "Cliente Chat",
      cpf: "529.982.247-25",
      email: "cliente-chat@example.com",
      phone: "11995554433",
      birthDate: "1992-02-18",
      password: "Senha123!"
    }
  });

  return register.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

test("participants can create conversation, exchange messages and mark read", async () => {
  const app = await createApp();
  const clientCookies = await registerClient(app);
  const businessCookies = await login(app, "negocio-seed@plataforma.local", "Business123!");

  const lead = await app.inject({
    method: "POST",
    url: "/api/v1/leads",
    headers: { cookie: clientCookies },
    payload: {
      businessSlug: "negocio-seed",
      subject: "Preciso de pintura da sala",
      message: "Quero conversar sobre prazo e acabamentos para pintar a sala ainda este mes."
    }
  });

  assert.equal(lead.statusCode, 201);

  const conversation = await app.inject({
    method: "POST",
    url: "/api/v1/conversations",
    headers: { cookie: clientCookies },
    payload: { leadId: lead.json().data.id }
  });

  assert.equal(conversation.statusCode, 201);
  const conversationId = conversation.json().data.id;

  const clientMessage = await app.inject({
    method: "POST",
    url: `/api/v1/conversations/${conversationId}/messages`,
    headers: { cookie: clientCookies },
    payload: { body: "Podemos falar dos horarios de visita tecnica?" }
  });

  assert.equal(clientMessage.statusCode, 201);
  const messageId = clientMessage.json().data.id;

  const businessMessage = await app.inject({
    method: "POST",
    url: `/api/v1/conversations/${conversationId}/messages`,
    headers: { cookie: businessCookies },
    payload: { body: "Sim, consigo visitar amanha no periodo da tarde." }
  });

  assert.equal(businessMessage.statusCode, 201);

  const attachment = await app.inject({
    method: "POST",
    url: `/api/v1/messages/${messageId}/attachments`,
    headers: { cookie: clientCookies },
    payload: {
      fileName: "referencia-cores.pdf",
      mimeType: "application/pdf",
      storageUrl: "https://files.platform.local/referencia-cores.pdf",
      sizeBytes: 20480
    }
  });

  assert.equal(attachment.statusCode, 201);

  const listed = await app.inject({
    method: "GET",
    url: "/api/v1/conversations",
    headers: { cookie: businessCookies }
  });

  assert.equal(listed.statusCode, 200);
  assert.equal(listed.json().data.length > 0, true);

  const messages = await app.inject({
    method: "GET",
    url: `/api/v1/conversations/${conversationId}/messages`,
    headers: { cookie: businessCookies }
  });

  assert.equal(messages.statusCode, 200);
  assert.equal(messages.json().data.messages.length >= 2, true);

  const marked = await app.inject({
    method: "PATCH",
    url: `/api/v1/conversations/${conversationId}/read`,
    headers: { cookie: businessCookies }
  });

  assert.equal(marked.statusCode, 200);
  assert.equal(marked.json().data.success, true);

  await app.close();
});

test("forbidden pattern message is rejected with validation error", async () => {
  const app = await createApp();
  const clientCookies = await registerClient(app);

  const lead = await app.inject({
    method: "POST",
    url: "/api/v1/leads",
    headers: { cookie: clientCookies },
    payload: {
      businessSlug: "negocio-seed",
      subject: "Conversa para orcamento",
      message: "Gostaria de discutir detalhes do orcamento para pintura externa."
    }
  });

  const conversation = await app.inject({
    method: "POST",
    url: "/api/v1/conversations",
    headers: { cookie: clientCookies },
    payload: { leadId: lead.json().data.id }
  });

  const rejected = await app.inject({
    method: "POST",
    url: `/api/v1/conversations/${conversation.json().data.id}/messages`,
    headers: { cookie: clientCookies },
    payload: { body: "Me envia sua chave pix para fechar agora" }
  });

  assert.equal(rejected.statusCode, 422);

  await app.close();
});