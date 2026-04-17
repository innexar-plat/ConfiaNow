import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  createModerationCase,
  listModerationCases,
  resolveModerationCase,
  listAdminVerifications,
  getAdminBusinessView,
  listAdminAuditLog
} from "@platform/moderation";
import { listPendingReviewModerationQueue } from "@platform/reviews";
import { getRequestContext } from "../../core/routes/auth-context";

const createCaseSchema = z.object({
  type: z.string().min(1),
  targetType: z.string().min(1),
  targetId: z.string().uuid(),
  description: z.string().min(10).max(1000)
});

const resolveCaseSchema = z.object({
  decision: z.enum(["resolved", "dismissed"]),
  note: z.string().max(500).optional()
});

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

async function requireAuthenticatedContext(
  request: FastifyRequest,
  reply: FastifyReply,
  instance: string
) {
  const context = await getRequestContext(request);
  if (!context.user?.id) {
    sendProblem(
      reply,
      401,
      "https://platform.local/problems/unauthorized",
      "Unauthorized",
      "Authentication is required",
      instance
    );
    return null;
  }
  return context;
}

async function requireAdminContext(
  request: FastifyRequest,
  reply: FastifyReply,
  instance: string
) {
  const context = await requireAuthenticatedContext(request, reply, instance);
  if (!context) return null;
  if (context.role !== "admin") {
    sendProblem(
      reply,
      403,
      "https://platform.local/problems/forbidden",
      "Forbidden",
      "Administrator access is required",
      instance
    );
    return null;
  }
  return context;
}

function handleModerationError(reply: FastifyReply, instance: string, error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (message === "MODERATION_CASE_NOT_FOUND") {
    return sendProblem(reply, 404, "https://platform.local/problems/not-found", "Not Found", "Moderation case not found", instance);
  }

  if (message === "MODERATION_CASE_ALREADY_CLOSED") {
    return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "This case is already closed", instance);
  }

  if (message === "BUSINESS_PROFILE_NOT_FOUND") {
    return sendProblem(reply, 404, "https://platform.local/problems/not-found", "Not Found", "Business profile not found", instance);
  }

  if (
    message.startsWith("INVALID_")
  ) {
    return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request body is invalid", instance);
  }

  return sendProblem(reply, 500, "https://platform.local/problems/internal-error", "Internal Server Error", "Unexpected error", instance);
}

export async function registerModerationRoutes(app: FastifyInstance) {
  // POST /admin/reports — qualquer usuario autenticado pode criar denuncia
  app.post("/admin/reports", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/admin/reports");
    if (!context?.user?.id) return;

    const parsed = createCaseSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request body is invalid", "/api/v1/admin/reports");
    }

    try {
      return reply.status(201).send({
        data: await createModerationCase({
          reporterUserId: context.user.id,
          ...parsed.data
        })
      });
    } catch (error) {
      return handleModerationError(reply, "/api/v1/admin/reports", error);
    }
  });

  // GET /admin/reports — somente admin
  app.get("/admin/reports", async (request, reply) => {
    const context = await requireAdminContext(request, reply, "/api/v1/admin/reports");
    if (!context) return;

    const query = request.query as Record<string, unknown>;

    try {
      return await listModerationCases({
        status: query.status,
        page: query.page,
        limit: query.limit
      });
    } catch (error) {
      return handleModerationError(reply, "/api/v1/admin/reports", error);
    }
  });

  // POST /admin/reports/:id/resolve — somente admin
  app.post("/admin/reports/:id/resolve", async (request, reply) => {
    const context = await requireAdminContext(request, reply, "/api/v1/admin/reports/:id/resolve");
    if (!context?.user?.id) return;

    const caseId = z.uuid().safeParse((request.params as { id: string }).id);
    if (!caseId.success) {
      return sendProblem(reply, 400, "https://platform.local/problems/bad-request", "Bad Request", "Invalid case id", "/api/v1/admin/reports/:id/resolve");
    }

    const parsed = resolveCaseSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request body is invalid", "/api/v1/admin/reports/:id/resolve");
    }

    try {
      return {
        data: await resolveModerationCase({
          caseId: caseId.data,
          adminUserId: context.user.id,
          ...parsed.data
        })
      };
    } catch (error) {
      return handleModerationError(reply, "/api/v1/admin/reports/:id/resolve", error);
    }
  });

  // GET /admin/verifications — somente admin
  app.get("/admin/verifications", async (request, reply) => {
    const context = await requireAdminContext(request, reply, "/api/v1/admin/verifications");
    if (!context) return;

    const query = request.query as Record<string, unknown>;

    try {
      return await listAdminVerifications({
        status: query.status,
        page: query.page,
        limit: query.limit
      });
    } catch (error) {
      return handleModerationError(reply, "/api/v1/admin/verifications", error);
    }
  });

  // GET /admin/reviews/pending — alias consolidado (somente admin)
  app.get("/admin/reviews/pending", async (request, reply) => {
    const context = await requireAdminContext(request, reply, "/api/v1/admin/reviews/pending");
    if (!context?.user?.id) return;

    try {
      return { data: await listPendingReviewModerationQueue(context.user.id) };
    } catch (error) {
      return handleModerationError(reply, "/api/v1/admin/reviews/pending", error);
    }
  });

  // GET /admin/businesses/:id — somente admin
  app.get("/admin/businesses/:id", async (request, reply) => {
    const context = await requireAdminContext(request, reply, "/api/v1/admin/businesses/:id");
    if (!context) return;

    const businessId = z.uuid().safeParse((request.params as { id: string }).id);
    if (!businessId.success) {
      return sendProblem(reply, 400, "https://platform.local/problems/bad-request", "Bad Request", "Invalid business id", "/api/v1/admin/businesses/:id");
    }

    try {
      return { data: await getAdminBusinessView(businessId.data) };
    } catch (error) {
      return handleModerationError(reply, "/api/v1/admin/businesses/:id", error);
    }
  });

  // GET /admin/audit-log — somente admin (paginado, alias de /admin/audit-logs)
  app.get("/admin/audit-log", async (request, reply) => {
    const context = await requireAdminContext(request, reply, "/api/v1/admin/audit-log");
    if (!context) return;

    const query = request.query as Record<string, unknown>;

    try {
      return await listAdminAuditLog({
        page: query.page,
        limit: query.limit
      });
    } catch (error) {
      return handleModerationError(reply, "/api/v1/admin/audit-log", error);
    }
  });
}
