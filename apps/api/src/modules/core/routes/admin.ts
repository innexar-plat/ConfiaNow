import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getAuditLogs, getSettings, updateSettings } from "../domain/core-store";
import { getRequestContext } from "./auth-context";

const updateSettingsSchema = z.object({
  allowNewBusinessRegistrations: z.boolean().optional(),
  requireManualReviewForAllReviews: z.boolean().optional(),
  publicSupportEmail: z.email().optional(),
  defaultLocale: z.enum(["pt-BR", "en", "es"]).optional()
});

function ensureAdmin(appPath: string, role: string, reply: { status: (code: number) => { send: (payload: unknown) => unknown } }) {
  if (role !== "admin") {
    return reply.status(403).send({
      type: "https://platform.local/problems/forbidden",
      title: "Forbidden",
      status: 403,
      detail: "Administrator access is required to access this resource",
      instance: appPath
    });
  }

  return null;
}

export async function registerAdminCoreRoutes(app: FastifyInstance) {
  app.get("/admin/settings", async (request, reply) => {
    const context = await getRequestContext(request);
    const forbidden = ensureAdmin("/api/v1/admin/settings", context.role, reply);

    if (forbidden) {
      return forbidden;
    }

    return {
      data: await getSettings()
    };
  });

  app.patch("/admin/settings", async (request, reply) => {
    const context = await getRequestContext(request);
    const forbidden = ensureAdmin("/api/v1/admin/settings", context.role, reply);

    if (forbidden) {
      return forbidden;
    }

    const parsed = updateSettingsSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(422).send({
        type: "https://platform.local/problems/validation-error",
        title: "Validation failed",
        status: 422,
        detail: "The request body is invalid",
        instance: "/api/v1/admin/settings"
      });
    }

    return {
      data: await updateSettings(parsed.data, context.user?.id ?? "")
    };
  });

  app.get("/admin/audit-logs", async (request, reply) => {
    const context = await getRequestContext(request);
    const forbidden = ensureAdmin("/api/v1/admin/audit-logs", context.role, reply);

    if (forbidden) {
      return forbidden;
    }

    return {
      data: await getAuditLogs()
    };
  });
}
