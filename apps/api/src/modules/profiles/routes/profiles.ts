import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  createOwnBusinessService,
  createOwnPortfolioItem,
  deleteOwnBusinessService,
  deleteOwnPortfolioItem,
  getOwnBusinessProfile,
  getPublicBusinessBySlug,
  getPublicBusinessServices,
  getPublicPortfolioItems,
  updateOwnBusinessProfile,
  updateOwnBusinessService,
  updateOwnPortfolioItem
} from "@platform/profiles";
import { getRequestContext } from "../../core/routes/auth-context";

const businessProfileSchema = z.object({
  businessName: z.string().min(3).max(160),
  headline: z.string().max(180).optional(),
  description: z.string().max(2000).optional(),
  publicEmail: z.email().optional(),
  publicPhone: z.string().max(30).optional(),
  whatsapp: z.string().max(30).optional(),
  websiteUrl: z.url().max(300).optional().or(z.literal("")),
  city: z.string().max(120).optional(),
  state: z.string().max(120).optional(),
  serviceArea: z.string().max(200).optional(),
  yearsInBusiness: z.coerce.number().int().min(0).max(100).optional(),
  isPublished: z.coerce.boolean().optional(),
  categories: z.array(z.string().min(2).max(80)).max(12).optional()
});

const businessServiceSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(600).optional(),
  priceLabel: z.string().max(60).optional(),
  displayOrder: z.coerce.number().int().min(0).max(999).optional()
});

const portfolioItemSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(600).optional(),
  mediaUrl: z.string().max(300).optional(),
  displayOrder: z.coerce.number().int().min(0).max(999).optional()
});

function sendProblem(reply: FastifyReply, status: number, type: string, title: string, detail: string, instance: string) {
  return reply.status(status).send({
    type,
    title,
    status,
    detail,
    instance
  });
}

async function requireBusinessUser(request: FastifyRequest, reply: FastifyReply, instance: string) {
  const context = await getRequestContext(request);

  if (!context.user?.id) {
    sendProblem(reply, 401, "https://platform.local/problems/unauthorized", "Unauthorized", "Authentication is required", instance);
    return null;
  }

  if (context.role !== "business") {
    sendProblem(reply, 403, "https://platform.local/problems/forbidden", "Forbidden", "Business role is required", instance);
    return null;
  }

  return context.user.id;
}

function handleProfilesError(reply: FastifyReply, instance: string, error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (message === "BUSINESS_ROLE_REQUIRED") {
    return sendProblem(reply, 403, "https://platform.local/problems/forbidden", "Forbidden", "Business role is required", instance);
  }

  if (message.endsWith("NOT_FOUND")) {
    return sendProblem(reply, 404, "https://platform.local/problems/not-found", "Not Found", "Requested resource was not found", instance);
  }

  if (message.startsWith("INVALID_") || message.includes("Unique constraint")) {
    return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request body is invalid", instance);
  }

  return sendProblem(reply, 500, "https://platform.local/problems/internal-error", "Internal Server Error", "Unexpected error", instance);
}

export async function registerProfilesRoutes(app: FastifyInstance) {
  app.get("/businesses/:slug", async (request, reply) => {
    const slug = z.string().min(1).parse((request.params as { slug: string }).slug);

    try {
      const business = await getPublicBusinessBySlug(slug);
      return { data: business };
    } catch (error) {
      return handleProfilesError(reply, "/api/v1/businesses/:slug", error);
    }
  });

  app.get("/businesses/:id/services", async (request, reply) => {
    const profileId = z.uuid().parse((request.params as { id: string }).id);

    try {
      return { data: await getPublicBusinessServices(profileId) };
    } catch (error) {
      return handleProfilesError(reply, "/api/v1/businesses/:id/services", error);
    }
  });

  app.get("/businesses/:id/portfolio", async (request, reply) => {
    const profileId = z.uuid().parse((request.params as { id: string }).id);

    try {
      return { data: await getPublicPortfolioItems(profileId) };
    } catch (error) {
      return handleProfilesError(reply, "/api/v1/businesses/:id/portfolio", error);
    }
  });

  app.get("/me/business-profile", async (request, reply) => {
    const userId = await requireBusinessUser(request, reply, "/api/v1/me/business-profile");
    if (!userId) {
      return;
    }

    try {
      return { data: await getOwnBusinessProfile(userId) };
    } catch (error) {
      return handleProfilesError(reply, "/api/v1/me/business-profile", error);
    }
  });

  app.patch("/me/business-profile", async (request, reply) => {
    const userId = await requireBusinessUser(request, reply, "/api/v1/me/business-profile");
    if (!userId) {
      return;
    }

    const parsed = businessProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request body is invalid", "/api/v1/me/business-profile");
    }

    try {
      return { data: await updateOwnBusinessProfile(userId, parsed.data) };
    } catch (error) {
      return handleProfilesError(reply, "/api/v1/me/business-profile", error);
    }
  });

  app.post("/me/services", async (request, reply) => {
    const userId = await requireBusinessUser(request, reply, "/api/v1/me/services");
    if (!userId) {
      return;
    }

    const parsed = businessServiceSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request body is invalid", "/api/v1/me/services");
    }

    try {
      return reply.status(201).send({ data: await createOwnBusinessService(userId, parsed.data) });
    } catch (error) {
      return handleProfilesError(reply, "/api/v1/me/services", error);
    }
  });

  app.patch("/me/services/:id", async (request, reply) => {
    const userId = await requireBusinessUser(request, reply, "/api/v1/me/services/:id");
    if (!userId) {
      return;
    }

    const serviceId = z.uuid().parse((request.params as { id: string }).id);
    const parsed = businessServiceSchema.partial().safeParse(request.body);
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request body is invalid", "/api/v1/me/services/:id");
    }

    try {
      return { data: await updateOwnBusinessService(userId, serviceId, parsed.data) };
    } catch (error) {
      return handleProfilesError(reply, "/api/v1/me/services/:id", error);
    }
  });

  app.delete("/me/services/:id", async (request, reply) => {
    const userId = await requireBusinessUser(request, reply, "/api/v1/me/services/:id");
    if (!userId) {
      return;
    }

    const serviceId = z.uuid().parse((request.params as { id: string }).id);

    try {
      await deleteOwnBusinessService(userId, serviceId);
      return reply.status(204).send();
    } catch (error) {
      return handleProfilesError(reply, "/api/v1/me/services/:id", error);
    }
  });

  app.post("/me/portfolio-items", async (request, reply) => {
    const userId = await requireBusinessUser(request, reply, "/api/v1/me/portfolio-items");
    if (!userId) {
      return;
    }

    const parsed = portfolioItemSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request body is invalid", "/api/v1/me/portfolio-items");
    }

    try {
      return reply.status(201).send({ data: await createOwnPortfolioItem(userId, parsed.data) });
    } catch (error) {
      return handleProfilesError(reply, "/api/v1/me/portfolio-items", error);
    }
  });

  app.patch("/me/portfolio-items/:id", async (request, reply) => {
    const userId = await requireBusinessUser(request, reply, "/api/v1/me/portfolio-items/:id");
    if (!userId) {
      return;
    }

    const portfolioItemId = z.uuid().parse((request.params as { id: string }).id);
    const parsed = portfolioItemSchema.partial().safeParse(request.body);
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request body is invalid", "/api/v1/me/portfolio-items/:id");
    }

    try {
      return { data: await updateOwnPortfolioItem(userId, portfolioItemId, parsed.data) };
    } catch (error) {
      return handleProfilesError(reply, "/api/v1/me/portfolio-items/:id", error);
    }
  });

  app.delete("/me/portfolio-items/:id", async (request, reply) => {
    const userId = await requireBusinessUser(request, reply, "/api/v1/me/portfolio-items/:id");
    if (!userId) {
      return;
    }

    const portfolioItemId = z.uuid().parse((request.params as { id: string }).id);

    try {
      await deleteOwnPortfolioItem(userId, portfolioItemId);
      return reply.status(204).send();
    } catch (error) {
      return handleProfilesError(reply, "/api/v1/me/portfolio-items/:id", error);
    }
  });
}