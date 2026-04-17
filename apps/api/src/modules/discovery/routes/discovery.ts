import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import {
  getCategoryDiscovery,
  getSearchSuggestions,
  getTopRatedDiscovery,
  getTrendingDiscovery,
  listCategories,
  listCities,
  searchBusinesses
} from "@platform/discovery";

const businessSearchQuerySchema = z.object({
  query: z.string().max(120).optional(),
  category: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
  sortBy: z.enum(["relevance", "name", "city"]).optional()
});

const suggestionQuerySchema = z.object({
  query: z.string().min(1).max(80)
});

function sendProblem(reply: FastifyReply, status: number, type: string, title: string, detail: string, instance: string) {
  return reply.status(status).send({ type, title, status, detail, instance });
}

function handleDiscoveryError(reply: FastifyReply, instance: string, error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (message.endsWith("NOT_FOUND")) {
    return sendProblem(reply, 404, "https://platform.local/problems/not-found", "Not Found", "Requested resource was not found", instance);
  }

  if (message.startsWith("INVALID_")) {
    return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request is invalid", instance);
  }

  return sendProblem(reply, 500, "https://platform.local/problems/internal-error", "Internal Server Error", "Unexpected error", instance);
}

export async function registerDiscoveryRoutes(app: FastifyInstance) {
  app.get("/businesses", async (request, reply) => {
    const parsed = businessSearchQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request is invalid", "/api/v1/businesses");
    }

    try {
      return {
        data: await searchBusinesses(parsed.data)
      };
    } catch (error) {
      return handleDiscoveryError(reply, "/api/v1/businesses", error);
    }
  });

  app.get("/search/suggestions", async (request, reply) => {
    const parsed = suggestionQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request is invalid", "/api/v1/search/suggestions");
    }

    try {
      return { data: await getSearchSuggestions(parsed.data.query) };
    } catch (error) {
      return handleDiscoveryError(reply, "/api/v1/search/suggestions", error);
    }
  });

  app.get("/categories", async (_request, reply) => {
    try {
      return { data: await listCategories() };
    } catch (error) {
      return handleDiscoveryError(reply, "/api/v1/categories", error);
    }
  });

  app.get("/categories/:slug", async (request, reply) => {
    const slug = z.string().min(1).parse((request.params as { slug: string }).slug);

    try {
      return { data: await getCategoryDiscovery(slug) };
    } catch (error) {
      return handleDiscoveryError(reply, "/api/v1/categories/:slug", error);
    }
  });

  app.get("/cities", async (_request, reply) => {
    try {
      return { data: await listCities() };
    } catch (error) {
      return handleDiscoveryError(reply, "/api/v1/cities", error);
    }
  });

  app.get("/discovery/trending", async (_request, reply) => {
    try {
      return { data: await getTrendingDiscovery() };
    } catch (error) {
      return handleDiscoveryError(reply, "/api/v1/discovery/trending", error);
    }
  });

  app.get("/discovery/top-rated", async (_request, reply) => {
    try {
      return { data: await getTopRatedDiscovery() };
    } catch (error) {
      return handleDiscoveryError(reply, "/api/v1/discovery/top-rated", error);
    }
  });
}