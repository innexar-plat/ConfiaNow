import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  getBusinessBadgeStatus,
  getPublicBusinessTrustScore,
  listBadgeLevels,
  recalculateBusinessTrustScore,
  restoreBusinessBadge,
  suspendBusinessBadge
} from "@platform/trust";
import { getRequestContext } from "../../core/routes/auth-context";

const suspendSchema = z.object({
  reason: z.string().min(3).max(300)
});

const restoreSchema = z.object({
  reason: z.string().max(300).optional()
});

function sendProblem(reply: FastifyReply, status: number, type: string, title: string, detail: string, instance: string) {
  return reply.status(status).send({ type, title, status, detail, instance });
}

async function requireAuthenticatedUser(request: FastifyRequest, reply: FastifyReply, instance: string) {
  const context = await getRequestContext(request);
  if (!context.user?.id) {
    sendProblem(reply, 401, "https://platform.local/problems/unauthorized", "Unauthorized", "Authentication is required", instance);
    return null;
  }
  return context;
}

async function requireAdminUser(request: FastifyRequest, reply: FastifyReply, instance: string) {
  const context = await requireAuthenticatedUser(request, reply, instance);
  if (!context) return null;
  if (context.role !== "admin") {
    sendProblem(reply, 403, "https://platform.local/problems/forbidden", "Forbidden", "Administrator access is required", instance);
    return null;
  }
  return context;
}

function handleTrustError(reply: FastifyReply, instance: string, error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (message === "BUSINESS_ROLE_REQUIRED") {
    return sendProblem(reply, 403, "https://platform.local/problems/forbidden", "Forbidden", "Business role is required", instance);
  }

  if (message.endsWith("NOT_FOUND")) {
    return sendProblem(reply, 404, "https://platform.local/problems/not-found", "Not Found", "Requested resource was not found", instance);
  }

  if (message.startsWith("INVALID_")) {
    return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request is invalid", instance);
  }

  return sendProblem(reply, 500, "https://platform.local/problems/internal-error", "Internal Server Error", "Unexpected error", instance);
}

export async function registerTrustRoutes(app: FastifyInstance) {
  app.get("/trust/badges", async (_request, reply) => {
    try {
      return { data: await listBadgeLevels() };
    } catch (error) {
      return handleTrustError(reply, "/api/v1/trust/badges", error);
    }
  });

  app.get("/businesses/:id/trust-score", async (request, reply) => {
    const businessProfileId = z.uuid().parse((request.params as { id: string }).id);

    try {
      return { data: await getPublicBusinessTrustScore(businessProfileId) };
    } catch (error) {
      return handleTrustError(reply, "/api/v1/businesses/:id/trust-score", error);
    }
  });

  app.get("/me/badge-status", async (request, reply) => {
    const context = await requireAuthenticatedUser(request, reply, "/api/v1/me/badge-status");
    if (!context) return;
    const userId = context.user?.id;
    if (!userId) return;

    try {
      return { data: await getBusinessBadgeStatus(userId) };
    } catch (error) {
      return handleTrustError(reply, "/api/v1/me/badge-status", error);
    }
  });

  app.post("/admin/trust/recalculate/:businessId", async (request, reply) => {
    const context = await requireAdminUser(request, reply, "/api/v1/admin/trust/recalculate/:businessId");
    if (!context) return;
    const businessProfileId = z.uuid().parse((request.params as { businessId: string }).businessId);
    const actorUserId = context.user?.id;
    if (!actorUserId) return;

    try {
      return { data: await recalculateBusinessTrustScore(businessProfileId, actorUserId, "Trust score recalculated by admin") };
    } catch (error) {
      return handleTrustError(reply, "/api/v1/admin/trust/recalculate/:businessId", error);
    }
  });

  app.post("/admin/trust/suspend/:businessId", async (request, reply) => {
    const context = await requireAdminUser(request, reply, "/api/v1/admin/trust/suspend/:businessId");
    if (!context) return;
    const businessProfileId = z.uuid().parse((request.params as { businessId: string }).businessId);
    const actorUserId = context.user?.id;
    if (!actorUserId) return;
    const parsed = suspendSchema.safeParse(request.body);

    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request is invalid", "/api/v1/admin/trust/suspend/:businessId");
    }

    try {
      return { data: await suspendBusinessBadge(businessProfileId, actorUserId, parsed.data.reason) };
    } catch (error) {
      return handleTrustError(reply, "/api/v1/admin/trust/suspend/:businessId", error);
    }
  });

  app.post("/admin/trust/restore/:businessId", async (request, reply) => {
    const context = await requireAdminUser(request, reply, "/api/v1/admin/trust/restore/:businessId");
    if (!context) return;
    const businessProfileId = z.uuid().parse((request.params as { businessId: string }).businessId);
    const actorUserId = context.user?.id;
    if (!actorUserId) return;
    const parsed = restoreSchema.safeParse(request.body ?? {});

    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request is invalid", "/api/v1/admin/trust/restore/:businessId");
    }

    try {
      return { data: await restoreBusinessBadge(businessProfileId, actorUserId, parsed.data.reason) };
    } catch (error) {
      return handleTrustError(reply, "/api/v1/admin/trust/restore/:businessId", error);
    }
  });
}