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

test("business profile can be published and read publicly by slug", async () => {
  const app = await createApp();
  const cookies = await loginSeedBusiness(app);

  const updated = await app.inject({
    method: "PATCH",
    url: "/api/v1/me/business-profile",
    headers: { cookie: cookies },
    payload: {
      businessName: "Color Master Orlando",
      headline: "Especialistas em pintura residencial premium",
      description: "Acabamento fino, preparacao tecnica e atendimento local.",
      publicEmail: "colormaster@example.com",
      publicPhone: "11991112222",
      city: "Orlando",
      state: "FL",
      serviceArea: "Orlando e Winter Park",
      yearsInBusiness: 12,
      isPublished: true,
      categories: ["residential-painting", "cabinet-painting"]
    }
  });

  assert.equal(updated.statusCode, 200);

  const slug = updated.json().data.slug;
  const publicProfile = await app.inject({
    method: "GET",
    url: `/api/v1/businesses/${slug}`
  });

  assert.equal(publicProfile.statusCode, 200);
  assert.equal(publicProfile.json().data.profile.slug, "color-master-orlando");
  assert.equal(publicProfile.json().data.profile.categories.length, 2);

  await app.close();
});

test("business can create update and delete services and portfolio", async () => {
  const app = await createApp();
  const cookies = await loginSeedBusiness(app);

  const profileResponse = await app.inject({
    method: "PATCH",
    url: "/api/v1/me/business-profile",
    headers: { cookie: cookies },
    payload: {
      businessName: "Studio Cor Viva",
      publicEmail: "corviva@example.com",
      publicPhone: "11993334444",
      isPublished: true
    }
  });

  const profileId = profileResponse.json().data.id;

  const service = await app.inject({
    method: "POST",
    url: "/api/v1/me/services",
    headers: { cookie: cookies },
    payload: {
      title: "Pintura externa",
      description: "Preparacao e acabamento para fachada",
      priceLabel: "A partir de $900"
    }
  });

  assert.equal(service.statusCode, 201);

  const updatedService = await app.inject({
    method: "PATCH",
    url: `/api/v1/me/services/${service.json().data.id}`,
    headers: { cookie: cookies },
    payload: {
      title: "Pintura externa premium",
      priceLabel: "A partir de $1200"
    }
  });

  assert.equal(updatedService.statusCode, 200);
  assert.equal(updatedService.json().data.title, "Pintura externa premium");

  const portfolio = await app.inject({
    method: "POST",
    url: "/api/v1/me/portfolio-items",
    headers: { cookie: cookies },
    payload: {
      title: "Projeto fachada contemporanea",
      description: "Casa com preparacao completa e acabamento acetinado",
      mediaUrl: "/portfolio/projeto-1.jpg"
    }
  });

  assert.equal(portfolio.statusCode, 201);

  const services = await app.inject({ method: "GET", url: `/api/v1/businesses/${profileId}/services` });
  const portfolioItems = await app.inject({ method: "GET", url: `/api/v1/businesses/${profileId}/portfolio` });

  assert.equal(services.statusCode, 200);
  assert.equal(services.json().data.some((item: { title: string }) => item.title === "Pintura externa premium"), true);
  assert.equal(portfolioItems.statusCode, 200);
  assert.equal(portfolioItems.json().data.some((item: { title: string }) => item.title === "Projeto fachada contemporanea"), true);

  const deletedService = await app.inject({
    method: "DELETE",
    url: `/api/v1/me/services/${service.json().data.id}`,
    headers: { cookie: cookies }
  });
  const deletedPortfolio = await app.inject({
    method: "DELETE",
    url: `/api/v1/me/portfolio-items/${portfolio.json().data.id}`,
    headers: { cookie: cookies }
  });

  assert.equal(deletedService.statusCode, 204);
  assert.equal(deletedPortfolio.statusCode, 204);

  const servicesAfterDelete = await app.inject({ method: "GET", url: `/api/v1/businesses/${profileId}/services` });
  const portfolioAfterDelete = await app.inject({ method: "GET", url: `/api/v1/businesses/${profileId}/portfolio` });

  assert.equal(servicesAfterDelete.json().data.some((item: { title: string }) => item.title === "Pintura externa premium"), false);
  assert.equal(portfolioAfterDelete.json().data.some((item: { title: string }) => item.title === "Projeto fachada contemporanea"), false);

  await app.close();
});