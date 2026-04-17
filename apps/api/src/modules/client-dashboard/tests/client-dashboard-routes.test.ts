import assert from "node:assert/strict";
import test from "node:test";
import { ReviewStatus } from "@prisma/client";
import { prisma, resetDatabaseForTests } from "@platform/database";
import { computeClientPendingReviewReason } from "@platform/client-dashboard";
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
      fullName: `Cliente Dashboard ${suffix}`,
      cpf: suffix === "A" ? "529.982.247-25" : "111.444.777-35",
      email: `cliente-dashboard-${suffix.toLowerCase()}@example.com`,
      phone: suffix === "A" ? "11990001111" : "11990002222",
      birthDate: "1991-02-12",
      password: "Senha123!"
    }
  });

  return response.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

test("computeClientPendingReviewReason allows released leads without final review", () => {
  const pending = computeClientPendingReviewReason({
    contactReleasedAt: new Date(),
    existingReviewStatus: null
  });

  const blocked = computeClientPendingReviewReason({
    contactReleasedAt: new Date(),
    existingReviewStatus: ReviewStatus.APPROVED
  });

  assert.equal(pending.canReview, true);
  assert.equal(blocked.canReview, false);
  assert.equal(blocked.reason, "REVIEW_ALREADY_EXISTS");
});

test("client can manage favorites and read overview, history and pending reviews", async () => {
  const app = await createApp();
  const businessCookies = await login(app, "negocio-seed@plataforma.local", "Business123!");
  const clientCookies = await registerClient(app, "A");

  const createLead = await app.inject({
    method: "POST",
    url: "/api/v1/leads",
    headers: { cookie: clientCookies },
    payload: {
      businessSlug: "negocio-seed",
      subject: "Pintura residencial externa",
      message: "Quero revisar fachada e pintar o muro lateral ainda este mes."
    }
  });

  assert.equal(createLead.statusCode, 201, `Lead criado: ${createLead.body}`);
  const leadId = createLead.json().data.id as string;
  const businessProfile = await prisma.businessProfile.findUnique({
    where: { slug: "negocio-seed" },
    select: { id: true }
  });

  assert.ok(businessProfile?.id, "Business profile seed nao encontrado");
  const businessProfileId = businessProfile.id;

  const favorite = await app.inject({
    method: "POST",
    url: `/api/v1/client-dashboard/favorites/${businessProfileId}`,
    headers: { cookie: clientCookies }
  });

  assert.equal(favorite.statusCode, 201, `Favorito criado: ${favorite.body}`);

  const favoriteAgain = await app.inject({
    method: "POST",
    url: `/api/v1/client-dashboard/favorites/${businessProfileId}`,
    headers: { cookie: clientCookies }
  });

  assert.equal(favoriteAgain.statusCode, 201, `Favorito refeito: ${favoriteAgain.body}`);

  const releaseContact = await app.inject({
    method: "POST",
    url: `/api/v1/leads/${leadId}/contact-release`,
    headers: { cookie: businessCookies },
    payload: { note: "Cliente pronto para seguir por telefone." }
  });

  assert.equal(releaseContact.statusCode, 201, `Contato liberado: ${releaseContact.body}`);

  const overview = await app.inject({
    method: "GET",
    url: "/api/v1/client-dashboard/overview",
    headers: { cookie: clientCookies }
  });

  assert.equal(overview.statusCode, 200, `Overview: ${overview.body}`);
  assert.equal(overview.json().data.favoritesCount, 1);
  assert.equal(overview.json().data.historyCount >= 1, true);
  assert.equal(overview.json().data.pendingReviewsCount >= 1, true);

  const favorites = await app.inject({
    method: "GET",
    url: "/api/v1/client-dashboard/favorites",
    headers: { cookie: clientCookies }
  });

  assert.equal(favorites.statusCode, 200, `Favorites: ${favorites.body}`);
  assert.equal(favorites.json().data.length, 1);
  assert.equal(favorites.json().data[0].businessProfileId, businessProfileId);

  const history = await app.inject({
    method: "GET",
    url: "/api/v1/client-dashboard/history",
    headers: { cookie: clientCookies }
  });

  assert.equal(history.statusCode, 200, `History: ${history.body}`);
  assert.equal(history.json().data.length, 1);
  assert.equal(history.json().data[0].canRecontact, true);
  assert.equal(history.json().data[0].isFavorited, true);

  const pendingReviews = await app.inject({
    method: "GET",
    url: "/api/v1/client-dashboard/pending-reviews",
    headers: { cookie: clientCookies }
  });

  assert.equal(pendingReviews.statusCode, 200, `Pending reviews: ${pendingReviews.body}`);
  assert.equal(pendingReviews.json().data.length, 1);
  assert.equal(pendingReviews.json().data[0].leadId, leadId);

  const removeFavorite = await app.inject({
    method: "DELETE",
    url: `/api/v1/client-dashboard/favorites/${businessProfileId}`,
    headers: { cookie: clientCookies }
  });

  assert.equal(removeFavorite.statusCode, 200, `Favorite removido: ${removeFavorite.body}`);

  const favoritesAfterDelete = await app.inject({
    method: "GET",
    url: "/api/v1/client-dashboard/favorites",
    headers: { cookie: clientCookies }
  });

  assert.equal(favoritesAfterDelete.statusCode, 200);
  assert.equal(favoritesAfterDelete.json().data.length, 0);

  await app.close();
});

test("non-client users cannot access client dashboard endpoints", async () => {
  const app = await createApp();
  const adminCookies = await login(app, "admin@plataforma.local", "Admin12345!");
  const businessCookies = await login(app, "negocio-seed@plataforma.local", "Business123!");

  const adminOverview = await app.inject({
    method: "GET",
    url: "/api/v1/client-dashboard/overview",
    headers: { cookie: adminCookies }
  });

  assert.equal(adminOverview.statusCode, 403);

  const businessOverview = await app.inject({
    method: "GET",
    url: "/api/v1/client-dashboard/overview",
    headers: { cookie: businessCookies }
  });

  assert.equal(businessOverview.statusCode, 403);

  await app.close();
});
