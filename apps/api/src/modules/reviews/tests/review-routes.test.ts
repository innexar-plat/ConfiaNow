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

async function registerClient(app: Awaited<ReturnType<typeof createApp>>) {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register/client",
    payload: {
      fullName: "Cliente Reviews",
      cpf: "11144477735",
      email: "reviews-client@example.com",
      phone: "11997776655",
      birthDate: "1991-08-20",
      password: "Senha123!"
    }
  });

  return response.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

test("client submits eligible review and admin approves it for public reputation", async () => {
  const app = await createApp();
  const clientCookies = await registerClient(app);
  const businessCookies = await login(app, "negocio-seed@plataforma.local", "Business123!");
  const adminCookies = await login(app, "admin@plataforma.local", "Admin12345!");

  const createdLead = await app.inject({
    method: "POST",
    url: "/api/v1/leads",
    headers: { cookie: clientCookies },
    payload: {
      businessSlug: "negocio-seed",
      subject: "Pintura da area gourmet",
      message: "Preciso de pintura completa na area gourmet e gostaria de receber um retorno rapido."
    }
  });

  assert.equal(createdLead.statusCode, 201);
  const leadId = createdLead.json().data.id;

  const responded = await app.inject({
    method: "PATCH",
    url: `/api/v1/leads/${leadId}/status`,
    headers: { cookie: businessCookies },
    payload: {
      status: "responded",
      responseMessage: "Podemos atender ainda esta semana.",
      note: "Primeiro retorno enviado"
    }
  });

  assert.equal(responded.statusCode, 200);

  const released = await app.inject({
    method: "POST",
    url: `/api/v1/leads/${leadId}/contact-release`,
    headers: { cookie: businessCookies },
    payload: { note: "Contato liberado para fechamento" }
  });

  assert.equal(released.statusCode, 201);

  const reviewCreated = await app.inject({
    method: "POST",
    url: "/api/v1/reviews",
    headers: { cookie: clientCookies },
    payload: {
      leadId,
      rating: 5,
      title: "Atendimento rapido e profissional",
      comment: "O negocio respondeu rapido, liberou o contato e conduziu bem as proximas etapas.",
      evidenceNote: "Conversa e visita tecnica confirmadas"
    }
  });

  assert.equal(reviewCreated.statusCode, 201);
  const reviewId = reviewCreated.json().data.id;

  const pending = await app.inject({
    method: "GET",
    url: "/api/v1/me/reviews/pending",
    headers: { cookie: adminCookies }
  });

  assert.equal(pending.statusCode, 200);
  assert.equal(pending.json().data.some((item: { id: string }) => item.id === reviewId), true);

  const approved = await app.inject({
    method: "POST",
    url: `/api/v1/admin/reviews/${reviewId}/approve`,
    headers: { cookie: adminCookies },
    payload: { decisionNote: "Lead validado e prova coerente." }
  });

  assert.equal(approved.statusCode, 200);
  assert.equal(approved.json().data.status, "approved");

  const businessProfile = await prisma.businessProfile.findFirstOrThrow({ where: { slug: "negocio-seed" } });

  const publicReviews = await app.inject({
    method: "GET",
    url: `/api/v1/businesses/${businessProfile.id}/reviews`
  });

  assert.equal(publicReviews.statusCode, 200);
  assert.equal(publicReviews.json().data.summary.approvedCount, 1);
  assert.equal(publicReviews.json().data.summary.averageRating, 5);

  const trustScore = await app.inject({
    method: "GET",
    url: `/api/v1/businesses/${businessProfile.id}/trust-score`
  });

  assert.equal(trustScore.statusCode, 200);
  assert.equal(trustScore.json().data.approvedReviewCount, 1);
  assert.equal(trustScore.json().data.averageRating, 5);
  assert.equal(trustScore.json().data.score >= 90, true);

  await app.close();
});