import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { BackgroundJobStatus, IntegrationProvider } from "@prisma/client";
import {
  getIntegrationsStatus,
  handleEmailProviderWebhook,
  handleStorageProviderWebhook,
  handleVerificationProviderWebhook,
  listBackgroundJobs,
  retryBackgroundJob
} from "@platform/integrations";
import { z } from "zod";
import { getRequestContext } from "../../core/routes/auth-context";

const webhookBodySchema = z
  .object({
    eventType: z.string().min(2).max(120).optional(),
    providerEventId: z.string().min(1).max(200).optional()
  })
  .passthrough();

const listJobsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  provider: z.nativeEnum(IntegrationProvider).optional(),
  status: z.nativeEnum(BackgroundJobStatus).optional(),
  jobType: z.string().min(2).max(120).optional()
});

const retryJobSchema = z.object({
  reason: z.string().min(3).max(300).optional()
});

function sendProblem(reply: FastifyReply, status: number, type: string, title: string, detail: string, instance: string) {
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

function resolveSignature(request: FastifyRequest) {
  const header = request.headers["x-provider-signature"];
  if (typeof header === "string") {
    return header;
  }
  if (Array.isArray(header) && header.length > 0) {
    return header[0];
  }
  return null;
}

function handleIntegrationsError(reply: FastifyReply, instance: string, error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (message === "JOB_NOT_FOUND") {
    return sendProblem(reply, 404, "https://platform.local/problems/not-found", "Not Found", "Background job not found", instance);
  }

  if (message === "JOB_ALREADY_RUNNING") {
    return sendProblem(reply, 409, "https://platform.local/problems/conflict", "Conflict", "Background job is already running", instance);
  }

  return sendProblem(reply, 500, "https://platform.local/problems/internal-error", "Internal Server Error", "Unexpected error", instance);
}

async function handleProviderWebhook(
  request: FastifyRequest,
  reply: FastifyReply,
  instance: string,
  providerHandler: (input: {
    endpoint: string;
    payload: Record<string, unknown>;
    signature: string;
    sourceIp?: string | null;
    providerEventId?: string | null;
    eventType?: string | null;
  }) => Promise<{ accepted: boolean; eventId: string; deliveryId: string; duplicate?: boolean }>
) {
  const signature = resolveSignature(request);
  if (!signature) {
    return sendProblem(reply, 401, "https://platform.local/problems/unauthorized", "Unauthorized", "Webhook signature is required", instance);
  }

  const parsed = webhookBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return sendProblem(reply, 400, "https://platform.local/problems/validation-error", "Validation failed", parsed.error.message, instance);
  }

  const payload = request.body as Record<string, unknown>;

  try {
    const data = await providerHandler({
      endpoint: instance,
      payload,
      signature,
      sourceIp: request.ip,
      providerEventId: parsed.data.providerEventId,
      eventType: parsed.data.eventType
    });

    return { data };
  } catch (error) {
    return handleIntegrationsError(reply, instance, error);
  }
}

export async function registerIntegrationsRoutes(app: FastifyInstance) {
  app.post("/webhooks/verification-provider", async (request, reply) => {
    return handleProviderWebhook(
      request,
      reply,
      "/api/v1/webhooks/verification-provider",
      handleVerificationProviderWebhook
    );
  });

  app.post("/webhooks/email-provider", async (request, reply) => {
    return handleProviderWebhook(
      request,
      reply,
      "/api/v1/webhooks/email-provider",
      handleEmailProviderWebhook
    );
  });

  app.post("/webhooks/storage-provider", async (request, reply) => {
    return handleProviderWebhook(
      request,
      reply,
      "/api/v1/webhooks/storage-provider",
      handleStorageProviderWebhook
    );
  });

  app.get("/admin/integrations/status", async (request, reply) => {
    const context = await requireAdmin(request, reply, "/api/v1/admin/integrations/status");
    if (!context) return;

    try {
      return await getIntegrationsStatus();
    } catch (error) {
      return handleIntegrationsError(reply, "/api/v1/admin/integrations/status", error);
    }
  });

  app.get("/admin/jobs", async (request, reply) => {
    const context = await requireAdmin(request, reply, "/api/v1/admin/jobs");
    if (!context) return;

    const parsed = listJobsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "Invalid query parameters", "/api/v1/admin/jobs");
    }

    try {
      return await listBackgroundJobs(parsed.data);
    } catch (error) {
      return handleIntegrationsError(reply, "/api/v1/admin/jobs", error);
    }
  });

  app.post("/admin/jobs/:id/retry", async (request, reply) => {
    const { id } = request.params as { id: string };
    const context = await requireAdmin(request, reply, `/api/v1/admin/jobs/${id}/retry`);
    if (!context?.user?.id) return;

    const parsed = retryJobSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return sendProblem(reply, 400, "https://platform.local/problems/validation-error", "Validation failed", parsed.error.message, `/api/v1/admin/jobs/${id}/retry`);
    }

    try {
      return await retryBackgroundJob({
        jobId: id,
        actorUserId: context.user.id,
        reason: parsed.data.reason
      });
    } catch (error) {
      return handleIntegrationsError(reply, `/api/v1/admin/jobs/${id}/retry`, error);
    }
  });
}
