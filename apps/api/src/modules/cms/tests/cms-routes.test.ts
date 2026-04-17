import assert from "node:assert/strict";
import test from "node:test";
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
  return response.cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

test("GET /pages/:slug returns 404 for non-existent page", async () => {
  const app = await createApp();

  const response = await app.inject({
    method: "GET",
    url: "/api/v1/pages/nao-existe"
  });

  assert.equal(response.statusCode, 404);
});

test("POST /admin/pages creates page and GET /pages/:slug returns it", async () => {
  const app = await createApp();
  const cookies = await loginAdmin(app);

  const createResponse = await app.inject({
    method: "POST",
    url: "/api/v1/admin/pages",
    headers: { cookie: cookies },
    payload: {
      slug: "pagina-teste",
      title: "Pagina de Teste CMS",
      description: "Descricao da pagina de teste",
      type: "CMS",
      sections: [
        { type: "text", title: "Secao 1", body: "Conteudo da secao 1", order: 0 },
        { type: "text", title: "Secao 2", body: "Conteudo da secao 2", order: 1 }
      ]
    }
  });

  assert.equal(createResponse.statusCode, 201, `Criar pagina: ${createResponse.body}`);
  const created = createResponse.json().data;
  assert.equal(created.slug, "pagina-teste");
  assert.equal(created.status, "DRAFT");
  assert.equal(created.sections.length, 2);

  // DRAFT pages should not be publicly accessible
  const getBeforePublish = await app.inject({
    method: "GET",
    url: "/api/v1/pages/pagina-teste"
  });
  assert.equal(getBeforePublish.statusCode, 404, "DRAFT page should not be publicly accessible");

  // Publish the page
  const publishResponse = await app.inject({
    method: "PATCH",
    url: `/api/v1/admin/pages/${created.id}`,
    headers: { cookie: cookies },
    payload: { status: "PUBLISHED" }
  });
  assert.equal(publishResponse.statusCode, 200, `Publicar pagina: ${publishResponse.body}`);
  assert.equal(publishResponse.json().data.status, "PUBLISHED");

  // Now publicly accessible
  const getAfterPublish = await app.inject({
    method: "GET",
    url: "/api/v1/pages/pagina-teste"
  });
  assert.equal(getAfterPublish.statusCode, 200, `Acessar pagina publicada: ${getAfterPublish.body}`);
  assert.equal(getAfterPublish.json().data.title, "Pagina de Teste CMS");
});

test("GET /admin/pages lists pages with pagination", async () => {
  const app = await createApp();
  const cookies = await loginAdmin(app);

  // Create 2 pages
  for (let i = 1; i <= 2; i++) {
    await app.inject({
      method: "POST",
      url: "/api/v1/admin/pages",
      headers: { cookie: cookies },
      payload: { slug: `pagina-lista-${i}`, title: `Pagina ${i}`, type: "CMS" }
    });
  }

  const response = await app.inject({
    method: "GET",
    url: "/api/v1/admin/pages",
    headers: { cookie: cookies }
  });

  assert.equal(response.statusCode, 200, `Listar paginas: ${response.body}`);
  const body = response.json();
  assert.ok(body.meta.total >= 2, "Deve ter pelo menos 2 paginas");
  assert.ok(Array.isArray(body.data), "data deve ser array");
});

test("DELETE /admin/pages/:id archives the page", async () => {
  const app = await createApp();
  const cookies = await loginAdmin(app);

  const createResponse = await app.inject({
    method: "POST",
    url: "/api/v1/admin/pages",
    headers: { cookie: cookies },
    payload: { slug: "pagina-delete", title: "Pagina para deletar", type: "CMS" }
  });
  const pageId = createResponse.json().data.id;

  const deleteResponse = await app.inject({
    method: "DELETE",
    url: `/api/v1/admin/pages/${pageId}`,
    headers: { cookie: cookies }
  });
  assert.equal(deleteResponse.statusCode, 200, `Arquivar pagina: ${deleteResponse.body}`);
  assert.equal(deleteResponse.json().data.success, true);

  // Archived page not accessible
  const getResponse = await app.inject({
    method: "GET",
    url: "/api/v1/pages/pagina-delete"
  });
  assert.equal(getResponse.statusCode, 404, "Pagina arquivada nao deve estar acessivel");
});

test("POST /admin/pages returns 409 for duplicate slug", async () => {
  const app = await createApp();
  const cookies = await loginAdmin(app);

  const payload = { slug: "slug-unico", title: "Primeira pagina", type: "CMS" };
  await app.inject({ method: "POST", url: "/api/v1/admin/pages", headers: { cookie: cookies }, payload });

  const duplicate = await app.inject({
    method: "POST",
    url: "/api/v1/admin/pages",
    headers: { cookie: cookies },
    payload
  });
  assert.equal(duplicate.statusCode, 409, `Conflito de slug: ${duplicate.body}`);
});

test("GET /seo/cities/:slug returns SEO metadata and businesses", async () => {
  const app = await createApp();

  const response = await app.inject({
    method: "GET",
    url: "/api/v1/seo/cities/orlando"
  });

  assert.equal(response.statusCode, 200, `SEO cidade: ${response.body}`);
  const body = response.json();
  assert.ok(body.data.seo.title, "SEO deve ter titulo");
  assert.ok(Array.isArray(body.data.businesses), "businesses deve ser array");
});

test("GET /seo/categories/:slug returns SEO metadata and businesses", async () => {
  const app = await createApp();

  const response = await app.inject({
    method: "GET",
    url: "/api/v1/seo/categories/pintura"
  });

  assert.equal(response.statusCode, 200, `SEO categoria: ${response.body}`);
  const body = response.json();
  assert.ok(body.data.seo.title, "SEO deve ter titulo");
  assert.ok(Array.isArray(body.data.businesses), "businesses deve ser array");
});

test("POST /admin/pages returns 401 for unauthenticated request", async () => {
  const app = await createApp();

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/admin/pages",
    payload: { slug: "test", title: "Test" }
  });

  assert.equal(response.statusCode, 401);
});
