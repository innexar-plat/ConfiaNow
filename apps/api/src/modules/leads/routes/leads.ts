import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { LeadStatus } from "@prisma/client";
import { z } from "zod";
import { createLead, getLeadDetailForUser, listBusinessLeadInbox, listClientLeads, releaseLeadContact, updateLeadStatus } from "@platform/leads";
import { getRequestContext } from "../../core/routes/auth-context";

const createLeadSchema = z.object({
  businessSlug: z.string().min(1).max(120),
  subject: z.string().min(4).max(140),
  message: z.string().min(10).max(2000)
});

const updateLeadStatusSchema = z.object({
  status: z.enum(["viewed", "responded", "contact_released", "closed"]),
  note: z.string().max(400).optional(),
  responseMessage: z.string().max(2000).optional()
});

const contactReleaseSchema = z.object({
  note: z.string().max(400).optional()
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

function mapLeadStatus(status: "viewed" | "responded" | "contact_released" | "closed") {
  const mapping = {
    viewed: LeadStatus.VIEWED,
    responded: LeadStatus.RESPONDED,
    contact_released: LeadStatus.CONTACT_RELEASED,
    closed: LeadStatus.CLOSED
  };

  return mapping[status];
}

function handleLeadError(reply: FastifyReply, instance: string, error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  if (message === "CLIENT_ROLE_REQUIRED" || message === "BUSINESS_ROLE_REQUIRED") {
    return sendProblem(reply, 403, "https://platform.local/problems/forbidden", "Forbidden", "Insufficient permissions", instance);
  }
  if (message === "LEAD_ACCESS_FORBIDDEN") {
    return sendProblem(reply, 403, "https://platform.local/problems/forbidden", "Forbidden", "Lead access denied", instance);
  }
  if (message === "INVALID_LEAD_STATUS_TRANSITION" || message === "OWN_BUSINESS_LEAD_NOT_ALLOWED") {
    return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request is invalid", instance);
  }
  if (message.endsWith("NOT_FOUND")) {
    return sendProblem(reply, 404, "https://platform.local/problems/not-found", "Not Found", "Requested resource was not found", instance);
  }
  return sendProblem(reply, 500, "https://platform.local/problems/internal-error", "Internal Server Error", "Unexpected error", instance);
}

export async function registerLeadRoutes(app: FastifyInstance) {
  app.post("/leads", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/leads");
    if (!context) return;
    const userId = context.user?.id;
    if (!userId) return;
    const parsed = createLeadSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request is invalid", "/api/v1/leads");
    }
    try {
      return reply.status(201).send({ data: await createLead({ clientUserId: userId, ...parsed.data }) });
    } catch (error) {
      return handleLeadError(reply, "/api/v1/leads", error);
    }
  });

  app.get("/me/leads", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/me/leads");
    if (!context) return;
    const userId = context.user?.id;
    if (!userId) return;
    try {
      return { data: await listClientLeads(userId) };
    } catch (error) {
      return handleLeadError(reply, "/api/v1/me/leads", error);
    }
  });

  app.get("/me/leads/inbox", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/me/leads/inbox");
    if (!context) return;
    const userId = context.user?.id;
    if (!userId) return;
    try {
      return { data: await listBusinessLeadInbox(userId) };
    } catch (error) {
      return handleLeadError(reply, "/api/v1/me/leads/inbox", error);
    }
  });

  app.get("/leads/:id", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/leads/:id");
    if (!context) return;
    const userId = context.user?.id;
    if (!userId) return;
    const leadId = z.uuid().parse((request.params as { id: string }).id);
    try {
      return { data: await getLeadDetailForUser(userId, context.role.toUpperCase() as never, leadId) };
    } catch (error) {
      return handleLeadError(reply, "/api/v1/leads/:id", error);
    }
  });

  app.patch("/leads/:id/status", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/leads/:id/status");
    if (!context) return;
    const userId = context.user?.id;
    if (!userId) return;
    const leadId = z.uuid().parse((request.params as { id: string }).id);
    const parsed = updateLeadStatusSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request is invalid", "/api/v1/leads/:id/status");
    }
    try {
      return { data: await updateLeadStatus({ businessUserId: userId, leadId, nextStatus: mapLeadStatus(parsed.data.status), note: parsed.data.note, responseMessage: parsed.data.responseMessage }) };
    } catch (error) {
      return handleLeadError(reply, "/api/v1/leads/:id/status", error);
    }
  });

  app.post("/leads/:id/contact-release", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/leads/:id/contact-release");
    if (!context) return;
    const userId = context.user?.id;
    if (!userId) return;
    const leadId = z.uuid().parse((request.params as { id: string }).id);
    const parsed = contactReleaseSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request is invalid", "/api/v1/leads/:id/contact-release");
    }
    try {
      return reply.status(201).send({ data: await releaseLeadContact({ businessUserId: userId, leadId, note: parsed.data.note }) });
    } catch (error) {
      return handleLeadError(reply, "/api/v1/leads/:id/contact-release", error);
    }
  });
}