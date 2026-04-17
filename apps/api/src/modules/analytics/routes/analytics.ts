import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  exportBusinessAnalyticsReport,
  getAdminAnalyticsFunnels,
  getAdminAnalyticsOverview,
  getBusinessAnalyticsLeads,
  getBusinessAnalyticsOverview,
  getBusinessAnalyticsReputation
} from "@platform/analytics";
import { getRequestContext } from "../../core/routes/auth-context";

const querySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  days: z.coerce.number().int().min(1).max(180).optional()
});

function sendProblem(reply: FastifyReply, status: number, type: string, title: string, detail: string, instance: string) {
  return reply.status(status).send({ type, title, status, detail, instance });
}

async function requireAdminContext(request: FastifyRequest, reply: FastifyReply, instance: string) {
  const context = await getRequestContext(request);
  if (!context.user?.id && context.role !== "admin") {
    sendProblem(reply, 401, "https://platform.local/problems/unauthorized", "Unauthorized", "Authentication is required", instance);
    return null;
  }

  if (context.role !== "admin") {
    sendProblem(reply, 403, "https://platform.local/problems/forbidden", "Forbidden", "Administrator role is required", instance);
    return null;
  }

  return context;
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

function handleAnalyticsError(reply: FastifyReply, instance: string, error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (["INVALID_ANALYTICS_DATE_RANGE"].includes(message)) {
    return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The query parameters are invalid", instance);
  }

  if (["BUSINESS_PROFILE_NOT_FOUND"].includes(message)) {
    return sendProblem(reply, 404, "https://platform.local/problems/not-found", "Not Found", "Business profile not found", instance);
  }

  return sendProblem(reply, 500, "https://platform.local/problems/internal-error", "Internal Server Error", "Unexpected error", instance);
}

export async function registerAnalyticsRoutes(app: FastifyInstance) {
  app.get("/analytics/admin/overview", async (request, reply) => {
    const context = await requireAdminContext(request, reply, "/api/v1/analytics/admin/overview");
    if (!context) return;

    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The query parameters are invalid", "/api/v1/analytics/admin/overview");
    }

    try {
      return { data: await getAdminAnalyticsOverview(parsed.data) };
    } catch (error) {
      return handleAnalyticsError(reply, "/api/v1/analytics/admin/overview", error);
    }
  });

  app.get("/analytics/admin/funnels", async (request, reply) => {
    const context = await requireAdminContext(request, reply, "/api/v1/analytics/admin/funnels");
    if (!context) return;

    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The query parameters are invalid", "/api/v1/analytics/admin/funnels");
    }

    try {
      return { data: await getAdminAnalyticsFunnels(parsed.data) };
    } catch (error) {
      return handleAnalyticsError(reply, "/api/v1/analytics/admin/funnels", error);
    }
  });

  app.get("/analytics/business/overview", async (request, reply) => {
    const context = await requireBusinessContext(request, reply, "/api/v1/analytics/business/overview");
    if (!context?.user?.id) return;

    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The query parameters are invalid", "/api/v1/analytics/business/overview");
    }

    try {
      return { data: await getBusinessAnalyticsOverview(context.user.id, parsed.data) };
    } catch (error) {
      return handleAnalyticsError(reply, "/api/v1/analytics/business/overview", error);
    }
  });

  app.get("/analytics/business/leads", async (request, reply) => {
    const context = await requireBusinessContext(request, reply, "/api/v1/analytics/business/leads");
    if (!context?.user?.id) return;

    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The query parameters are invalid", "/api/v1/analytics/business/leads");
    }

    try {
      return { data: await getBusinessAnalyticsLeads(context.user.id, parsed.data) };
    } catch (error) {
      return handleAnalyticsError(reply, "/api/v1/analytics/business/leads", error);
    }
  });

  app.get("/analytics/business/reputation", async (request, reply) => {
    const context = await requireBusinessContext(request, reply, "/api/v1/analytics/business/reputation");
    if (!context?.user?.id) return;

    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The query parameters are invalid", "/api/v1/analytics/business/reputation");
    }

    try {
      return { data: await getBusinessAnalyticsReputation(context.user.id, parsed.data) };
    } catch (error) {
      return handleAnalyticsError(reply, "/api/v1/analytics/business/reputation", error);
    }
  });

  app.get("/analytics/business/export", async (request, reply) => {
    const context = await requireBusinessContext(request, reply, "/api/v1/analytics/business/export");
    if (!context?.user?.id) return;

    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The query parameters are invalid", "/api/v1/analytics/business/export");
    }

    try {
      const report = await exportBusinessAnalyticsReport(context.user.id, parsed.data);
      return reply
        .header("content-type", report.contentType)
        .header("content-disposition", `attachment; filename=\"${report.filename}\"`)
        .send(report.csv);
    } catch (error) {
      return handleAnalyticsError(reply, "/api/v1/analytics/business/export", error);
    }
  });
}
