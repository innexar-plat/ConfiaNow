import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  addClientFavorite,
  getClientDashboardOverview,
  listClientDashboardFavorites,
  listClientDashboardHistory,
  listClientPendingReviews,
  removeClientFavorite
} from "@platform/client-dashboard";
import { getRequestContext } from "../../core/routes/auth-context";

function sendProblem(reply: FastifyReply, status: number, type: string, title: string, detail: string, instance: string) {
  return reply.status(status).send({ type, title, status, detail, instance });
}

async function requireClientContext(request: FastifyRequest, reply: FastifyReply, instance: string) {
  const context = await getRequestContext(request);
  if (!context.user?.id) {
    sendProblem(reply, 401, "https://platform.local/problems/unauthorized", "Unauthorized", "Authentication is required", instance);
    return null;
  }

  if (context.role !== "client") {
    sendProblem(reply, 403, "https://platform.local/problems/forbidden", "Forbidden", "Client role is required", instance);
    return null;
  }

  return context;
}

function handleClientDashboardError(reply: FastifyReply, instance: string, error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (["CLIENT_ROLE_REQUIRED"].includes(message)) {
    return sendProblem(reply, 403, "https://platform.local/problems/forbidden", "Forbidden", "Client role is required", instance);
  }

  if (["BUSINESS_PROFILE_NOT_FOUND"].includes(message)) {
    return sendProblem(reply, 404, "https://platform.local/problems/not-found", "Not Found", "Business profile not found", instance);
  }

  return sendProblem(reply, 500, "https://platform.local/problems/internal-error", "Internal Server Error", "Unexpected error", instance);
}

export async function registerClientDashboardRoutes(app: FastifyInstance) {
  app.get("/client-dashboard/overview", async (request, reply) => {
    const context = await requireClientContext(request, reply, "/api/v1/client-dashboard/overview");
    if (!context?.user?.id) return;

    try {
      return { data: await getClientDashboardOverview(context.user.id) };
    } catch (error) {
      return handleClientDashboardError(reply, "/api/v1/client-dashboard/overview", error);
    }
  });

  app.get("/client-dashboard/favorites", async (request, reply) => {
    const context = await requireClientContext(request, reply, "/api/v1/client-dashboard/favorites");
    if (!context?.user?.id) return;

    try {
      return { data: await listClientDashboardFavorites(context.user.id) };
    } catch (error) {
      return handleClientDashboardError(reply, "/api/v1/client-dashboard/favorites", error);
    }
  });

  app.post("/client-dashboard/favorites/:businessId", async (request, reply) => {
    const context = await requireClientContext(request, reply, "/api/v1/client-dashboard/favorites/:businessId");
    if (!context?.user?.id) return;

    const businessId = z.uuid().safeParse((request.params as { businessId: string }).businessId);
    if (!businessId.success) {
      return sendProblem(reply, 400, "https://platform.local/problems/bad-request", "Bad Request", "Invalid business id", "/api/v1/client-dashboard/favorites/:businessId");
    }

    try {
      return reply.status(201).send({ data: await addClientFavorite(context.user.id, businessId.data) });
    } catch (error) {
      return handleClientDashboardError(reply, "/api/v1/client-dashboard/favorites/:businessId", error);
    }
  });

  app.delete("/client-dashboard/favorites/:businessId", async (request, reply) => {
    const context = await requireClientContext(request, reply, "/api/v1/client-dashboard/favorites/:businessId");
    if (!context?.user?.id) return;

    const businessId = z.uuid().safeParse((request.params as { businessId: string }).businessId);
    if (!businessId.success) {
      return sendProblem(reply, 400, "https://platform.local/problems/bad-request", "Bad Request", "Invalid business id", "/api/v1/client-dashboard/favorites/:businessId");
    }

    try {
      return { data: await removeClientFavorite(context.user.id, businessId.data) };
    } catch (error) {
      return handleClientDashboardError(reply, "/api/v1/client-dashboard/favorites/:businessId", error);
    }
  });

  app.get("/client-dashboard/history", async (request, reply) => {
    const context = await requireClientContext(request, reply, "/api/v1/client-dashboard/history");
    if (!context?.user?.id) return;

    try {
      return { data: await listClientDashboardHistory(context.user.id) };
    } catch (error) {
      return handleClientDashboardError(reply, "/api/v1/client-dashboard/history", error);
    }
  });

  app.get("/client-dashboard/pending-reviews", async (request, reply) => {
    const context = await requireClientContext(request, reply, "/api/v1/client-dashboard/pending-reviews");
    if (!context?.user?.id) return;

    try {
      return { data: await listClientPendingReviews(context.user.id) };
    } catch (error) {
      return handleClientDashboardError(reply, "/api/v1/client-dashboard/pending-reviews", error);
    }
  });
}
