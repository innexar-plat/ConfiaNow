import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  getNotificationPreferences,
  listNotifications,
  markNotificationRead,
  triggerCampaign,
  updateNotificationPreferences
} from "@platform/notifications";
import { getRequestContext } from "../../core/routes/auth-context";

const updatePreferencesSchema = z.object({
  inAppEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  leadAlertsEnabled: z.boolean().optional(),
  reviewAlertsEnabled: z.boolean().optional(),
  marketingEnabled: z.boolean().optional()
});

const triggerCampaignSchema = z.object({
  campaignCode: z.string().min(3).max(80),
  title: z.string().min(3).max(140),
  body: z.string().min(10).max(1000),
  targetRole: z.enum(["client", "business", "admin"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

function sendProblem(reply: FastifyReply, status: number, type: string, title: string, detail: string, instance: string) {
  return reply.status(status).send({ type, title, status, detail, instance });
}

async function requireAuthenticatedContext(request: FastifyRequest, reply: FastifyReply, instance: string) {
  const context = await getRequestContext(request);

  if (!context.user?.id) {
    sendProblem(reply, 401, "https://platform.local/problems/unauthorized", "Unauthorized", "Authentication is required", instance);
    return null;
  }

  return context;
}

async function requireAdminContext(request: FastifyRequest, reply: FastifyReply, instance: string) {
  const context = await requireAuthenticatedContext(request, reply, instance);

  if (!context) {
    return null;
  }

  if (context.role !== "admin") {
    sendProblem(reply, 403, "https://platform.local/problems/forbidden", "Forbidden", "Administrator access is required", instance);
    return null;
  }

  return context;
}

function handleNotificationError(reply: FastifyReply, instance: string, error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (["ADMIN_ROLE_REQUIRED"].includes(message)) {
    return sendProblem(reply, 403, "https://platform.local/problems/forbidden", "Forbidden", "Administrator access is required", instance);
  }

  if (["USER_NOT_FOUND", "NOTIFICATION_NOT_FOUND"].includes(message)) {
    return sendProblem(reply, 404, "https://platform.local/problems/not-found", "Not Found", "Requested resource was not found", instance);
  }

  return sendProblem(reply, 500, "https://platform.local/problems/internal-error", "Internal Server Error", "Unexpected error", instance);
}

export async function registerNotificationsRoutes(app: FastifyInstance) {
  app.get("/notifications", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/notifications");
    if (!context?.user?.id) return;

    const query = request.query as Record<string, unknown>;

    try {
      return await listNotifications({
        userId: context.user.id,
        page: query.page,
        limit: query.limit
      });
    } catch (error) {
      return handleNotificationError(reply, "/api/v1/notifications", error);
    }
  });

  app.patch("/notifications/:id/read", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/notifications/:id/read");
    if (!context?.user?.id) return;

    const notificationId = z.uuid().safeParse((request.params as { id: string }).id);

    if (!notificationId.success) {
      return sendProblem(reply, 400, "https://platform.local/problems/bad-request", "Bad Request", "Invalid notification id", "/api/v1/notifications/:id/read");
    }

    try {
      return { data: await markNotificationRead(context.user.id, notificationId.data) };
    } catch (error) {
      return handleNotificationError(reply, "/api/v1/notifications/:id/read", error);
    }
  });

  app.get("/notification-preferences", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/notification-preferences");
    if (!context?.user?.id) return;

    try {
      return { data: await getNotificationPreferences(context.user.id) };
    } catch (error) {
      return handleNotificationError(reply, "/api/v1/notification-preferences", error);
    }
  });

  app.patch("/notification-preferences", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/notification-preferences");
    if (!context?.user?.id) return;

    const parsed = updatePreferencesSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request body is invalid", "/api/v1/notification-preferences");
    }

    try {
      return { data: await updateNotificationPreferences({ userId: context.user.id, ...parsed.data }) };
    } catch (error) {
      return handleNotificationError(reply, "/api/v1/notification-preferences", error);
    }
  });

  app.post("/admin/campaigns/trigger", async (request, reply) => {
    const context = await requireAdminContext(request, reply, "/api/v1/admin/campaigns/trigger");
    if (!context?.user?.id) return;

    const parsed = triggerCampaignSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request body is invalid", "/api/v1/admin/campaigns/trigger");
    }

    try {
      return reply.status(201).send({
        data: await triggerCampaign({
          adminUserId: context.user.id,
          ...parsed.data
        })
      });
    } catch (error) {
      return handleNotificationError(reply, "/api/v1/admin/campaigns/trigger", error);
    }
  });
}
