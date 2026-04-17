import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { PageStatus, PageType } from "@prisma/client";
import {
  createPage,
  deletePage,
  getCategorySeoData,
  getCategoryPageBusinesses,
  getCitySeoData,
  getCityPageBusinesses,
  getPageBySlug,
  listAdminPages,
  updatePage
} from "@platform/cms";
import { getRequestContext } from "../../core/routes/auth-context";

// ── Helpers ──────────────────────────────────────────────────────────────────

function sendProblem(
  reply: FastifyReply,
  status: number,
  type: string,
  title: string,
  detail: string,
  instance: string
) {
  return reply.status(status).send({ type, title, status, detail, instance });
}

async function requireAdmin(request: FastifyRequest, reply: FastifyReply, instance: string) {
  const context = await getRequestContext(request);
  if (!context.user?.id) {
    sendProblem(reply, 401, "https://platform.local/problems/unauthorized", "Unauthorized", "Authentication required", instance);
    return null;
  }
  if (context.role !== "admin") {
    sendProblem(reply, 403, "https://platform.local/problems/forbidden", "Forbidden", "Admin role required", instance);
    return null;
  }
  return context;
}

function handleCmsError(reply: FastifyReply, instance: string, error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (message === "PAGE_NOT_FOUND") {
    return sendProblem(reply, 404, "https://platform.local/problems/not-found", "Not Found", "Page not found", instance);
  }
  if (message === "PAGE_NOT_PUBLISHED") {
    return sendProblem(reply, 404, "https://platform.local/problems/not-found", "Not Found", "Page not found", instance);
  }
  if (message === "PAGE_SLUG_CONFLICT") {
    return sendProblem(reply, 409, "https://platform.local/problems/conflict", "Conflict", "A page with this slug already exists", instance);
  }

  return sendProblem(reply, 500, "https://platform.local/problems/internal-error", "Internal Server Error", "Unexpected error", instance);
}

// ── Schemas ──────────────────────────────────────────────────────────────────

const pageSectionSchema = z.object({
  type: z.string().min(1).max(64),
  order: z.number().int().min(0).optional(),
  title: z.string().max(255).optional().nullable(),
  body: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable()
});

const createPageSchema = z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  type: z.nativeEnum(PageType).optional(),
  title: z.string().min(1).max(255),
  description: z.string().max(500).optional().nullable(),
  ogImage: z.string().url().optional().nullable(),
  seoTitle: z.string().max(255).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
  canonicalUrl: z.string().url().optional().nullable(),
  entitySlug: z.string().max(120).optional().nullable(),
  sections: z.array(pageSectionSchema).optional()
});

const updatePageSchema = createPageSchema
  .omit({ slug: true })
  .partial()
  .extend({ status: z.nativeEnum(PageStatus).optional() });

const adminPagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  type: z.nativeEnum(PageType).optional(),
  status: z.nativeEnum(PageStatus).optional()
});

// ── Routes ────────────────────────────────────────────────────────────────────

export async function registerCmsRoutes(app: FastifyInstance) {
  // ── Public: GET /pages/:slug ──────────────────────────────────────────────
  app.get("/pages/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    try {
      const page = await getPageBySlug(slug);
      return { data: page };
    } catch (error) {
      return handleCmsError(reply, `/api/v1/pages/${slug}`, error);
    }
  });

  // ── Public: GET /seo/cities/:slug ─────────────────────────────────────────
  app.get("/seo/cities/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    try {
      const [seo, businesses] = await Promise.all([
        getCitySeoData(slug),
        getCityPageBusinesses(slug)
      ]);
      return { data: { seo, businesses } };
    } catch (error) {
      return handleCmsError(reply, `/api/v1/seo/cities/${slug}`, error);
    }
  });

  // ── Public: GET /seo/categories/:slug ────────────────────────────────────
  app.get("/seo/categories/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    try {
      const [seo, businesses] = await Promise.all([
        getCategorySeoData(slug),
        getCategoryPageBusinesses(slug)
      ]);
      return { data: { seo, businesses } };
    } catch (error) {
      return handleCmsError(reply, `/api/v1/seo/categories/${slug}`, error);
    }
  });

  // ── Admin: GET /admin/pages ───────────────────────────────────────────────
  app.get("/admin/pages", async (request, reply) => {
    const context = await requireAdmin(request, reply, "/api/v1/admin/pages");
    if (!context) return;

    const parsed = adminPagesQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "Invalid query parameters", "/api/v1/admin/pages");
    }

    try {
      return await listAdminPages(parsed.data);
    } catch (error) {
      return handleCmsError(reply, "/api/v1/admin/pages", error);
    }
  });

  // ── Admin: POST /admin/pages ──────────────────────────────────────────────
  app.post("/admin/pages", async (request, reply) => {
    const context = await requireAdmin(request, reply, "/api/v1/admin/pages");
    if (!context) return;

    const parsed = createPageSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendProblem(reply, 400, "https://platform.local/problems/validation-error", "Validation failed", parsed.error.message, "/api/v1/admin/pages");
    }

    try {
      const page = await createPage({ ...parsed.data, authorId: context.user!.id });
      return reply.status(201).send({ data: page });
    } catch (error) {
      return handleCmsError(reply, "/api/v1/admin/pages", error);
    }
  });

  // ── Admin: PATCH /admin/pages/:id ─────────────────────────────────────────
  app.patch("/admin/pages/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const context = await requireAdmin(request, reply, `/api/v1/admin/pages/${id}`);
    if (!context) return;

    const parsed = updatePageSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendProblem(reply, 400, "https://platform.local/problems/validation-error", "Validation failed", parsed.error.message, `/api/v1/admin/pages/${id}`);
    }

    try {
      const page = await updatePage(id, parsed.data);
      return { data: page };
    } catch (error) {
      return handleCmsError(reply, `/api/v1/admin/pages/${id}`, error);
    }
  });

  // ── Admin: DELETE /admin/pages/:id ────────────────────────────────────────
  app.delete("/admin/pages/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const context = await requireAdmin(request, reply, `/api/v1/admin/pages/${id}`);
    if (!context) return;

    try {
      const result = await deletePage(id);
      return { data: result };
    } catch (error) {
      return handleCmsError(reply, `/api/v1/admin/pages/${id}`, error);
    }
  });
}
