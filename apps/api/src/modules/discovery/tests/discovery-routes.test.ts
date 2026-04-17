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

test("public discovery lists businesses and filters by category and city", async () => {
  const app = await createApp();
  const cookies = await loginSeedBusiness(app);

  await app.inject({
    method: "PATCH",
    url: "/api/v1/me/business-profile",
    headers: { cookie: cookies },
    payload: {
      businessName: "Orlando Elite Painting",
      headline: "Pintura residencial de alto padrao",
      description: "Equipe local com foco em acabamento e prazo",
      city: "Orlando",
      state: "FL",
      serviceArea: "Orlando e Winter Park",
      publicEmail: "elite@example.com",
      publicPhone: "11888887777",
      isPublished: true,
      categories: ["residential-painting", "interior-painting"]
    }
  });

  const allResults = await app.inject({ method: "GET", url: "/api/v1/businesses" });
  const filtered = await app.inject({ method: "GET", url: "/api/v1/businesses?category=residential-painting&city=orlando" });

  assert.equal(allResults.statusCode, 200);
  assert.equal(Array.isArray(allResults.json().data), true);
  assert.equal(filtered.statusCode, 200);
  assert.equal(filtered.json().data.some((item: { slug: string }) => item.slug === "orlando-elite-painting"), true);

  await app.close();
});

test("discovery suggestions, categories, cities and trending are public", async () => {
  const app = await createApp();

  const suggestions = await app.inject({ method: "GET", url: "/api/v1/search/suggestions?query=paint" });
  const categories = await app.inject({ method: "GET", url: "/api/v1/categories" });
  const cities = await app.inject({ method: "GET", url: "/api/v1/cities" });
  const trending = await app.inject({ method: "GET", url: "/api/v1/discovery/trending" });
  const topRated = await app.inject({ method: "GET", url: "/api/v1/discovery/top-rated" });

  assert.equal(suggestions.statusCode, 200);
  assert.equal(categories.statusCode, 200);
  assert.equal(cities.statusCode, 200);
  assert.equal(trending.statusCode, 200);
  assert.equal(topRated.statusCode, 200);
  assert.equal(categories.json().data.length > 0, true);
  assert.equal(cities.json().data.length > 0, true);

  await app.close();
});

test("category endpoint returns public businesses for the slug", async () => {
  const app = await createApp();
  const response = await app.inject({ method: "GET", url: "/api/v1/categories/residential-painting" });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().data.category.slug, "residential-painting");
  assert.equal(Array.isArray(response.json().data.businesses), true);

  await app.close();
});