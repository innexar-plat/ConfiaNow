import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  getProviderDashboardOverview,
  getProviderDashboardPerformance,
  listProviderDashboardRecommendations,
  listProviderDashboardPendingActions
} from "@platform/provider-dashboard";
import { getRequestContext } from "../../core/routes/auth-context";

function sendProblem(reply: FastifyReply, status: number, type: string, title: string, detail: string, instance: string) {
  return reply.status(status).send({ type, title, status, detail, instance });
}

async function requireBusinessContext(request: FastifyRequest, reply: FastifyReply, instance: string) {
  const context = await getRequestContext(request);
  if (!context.user?.id) {
    sendProblem(reply, 401, "https://platform.local/problems/unauthorized", "Unauthorized", "Authentication is required", instance);
    return null;
  }

  if (context.role !== "business") {
    sendProblem(reply, 403, "https://platform.local/problems/forbidden", "Forbidden", "Business role is required", instance);
    return null;
  }

  return context;
}

function handleProviderDashboardError(reply: FastifyReply, instance: string, error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (["BUSINESS_ROLE_REQUIRED", "BUSINESS_PROFILE_NOT_FOUND"].includes(message)) {
    return sendProblem(reply, 403, "https://platform.local/problems/forbidden", "Forbidden", "Business account is required", instance);
  }

  return sendProblem(reply, 500, "https://platform.local/problems/internal-error", "Internal Server Error", "Unexpected error", instance);
}

export async function registerProviderDashboardRoutes(app: FastifyInstance) {
  app.get("/provider-dashboard/overview", async (request, reply) => {
    const context = await requireBusinessContext(request, reply, "/api/v1/provider-dashboard/overview");
    if (!context?.user?.id) return;

    try {
      return { data: await getProviderDashboardOverview(context.user.id) };
    } catch (error) {
      return handleProviderDashboardError(reply, "/api/v1/provider-dashboard/overview", error);
    }
  });

  app.get("/provider-dashboard/recommendations", async (request, reply) => {
    const context = await requireBusinessContext(request, reply, "/api/v1/provider-dashboard/recommendations");
    if (!context?.user?.id) return;

    try {
      return { data: await listProviderDashboardRecommendations(context.user.id) };
    } catch (error) {
      return handleProviderDashboardError(reply, "/api/v1/provider-dashboard/recommendations", error);
    }
  });

  app.get("/provider-dashboard/performance", async (request, reply) => {
    const context = await requireBusinessContext(request, reply, "/api/v1/provider-dashboard/performance");
    if (!context?.user?.id) return;

    try {
      return { data: await getProviderDashboardPerformance(context.user.id) };
    } catch (error) {
      return handleProviderDashboardError(reply, "/api/v1/provider-dashboard/performance", error);
    }
  });

  app.get("/provider-dashboard/pending-actions", async (request, reply) => {
    const context = await requireBusinessContext(request, reply, "/api/v1/provider-dashboard/pending-actions");
    if (!context?.user?.id) return;

    try {
      return { data: await listProviderDashboardPendingActions(context.user.id) };
    } catch (error) {
      return handleProviderDashboardError(reply, "/api/v1/provider-dashboard/pending-actions", error);
    }
  });
}
