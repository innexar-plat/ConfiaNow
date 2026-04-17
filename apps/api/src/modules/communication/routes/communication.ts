import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  addMessageAttachment,
  createConversation,
  getConversationMessages,
  listConversations,
  markConversationAsRead,
  sendConversationMessage
} from "@platform/communication";
import { getRequestContext } from "../../core/routes/auth-context";

const createConversationSchema = z.object({ leadId: z.uuid() });
const createMessageSchema = z.object({ body: z.string().min(2).max(2000) });
const messageAttachmentSchema = z.object({
  fileName: z.string().min(2).max(160),
  mimeType: z.string().min(3).max(120),
  storageUrl: z.string().url().max(400),
  sizeBytes: z.coerce.number().int().min(1).max(10 * 1024 * 1024)
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

function handleCommunicationError(reply: FastifyReply, instance: string, error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (["CONVERSATION_ACCESS_FORBIDDEN", "ATTACHMENT_OWNER_REQUIRED"].includes(message)) {
    return sendProblem(reply, 403, "https://platform.local/problems/forbidden", "Forbidden", "Conversation access denied", instance);
  }

  if (["INVALID_MESSAGE_BODY", "INVALID_ATTACHMENT", "FORBIDDEN_MESSAGE_PATTERN"].includes(message)) {
    return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request is invalid", instance);
  }

  if (message.endsWith("NOT_FOUND")) {
    return sendProblem(reply, 404, "https://platform.local/problems/not-found", "Not Found", "Requested resource was not found", instance);
  }

  return sendProblem(reply, 500, "https://platform.local/problems/internal-error", "Internal Server Error", "Unexpected error", instance);
}

export async function registerCommunicationRoutes(app: FastifyInstance) {
  app.get("/conversations", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/conversations");
    const userId = context?.user?.id;
    if (!userId) return;

    try {
      return { data: await listConversations(userId) };
    } catch (error) {
      return handleCommunicationError(reply, "/api/v1/conversations", error);
    }
  });

  app.post("/conversations", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/conversations");
    const userId = context?.user?.id;
    if (!userId) return;
    const parsed = createConversationSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request is invalid", "/api/v1/conversations");
    }

    try {
      return reply.status(201).send({ data: await createConversation({ actorUserId: userId, leadId: parsed.data.leadId }) });
    } catch (error) {
      return handleCommunicationError(reply, "/api/v1/conversations", error);
    }
  });

  app.get("/conversations/:id/messages", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/conversations/:id/messages");
    const userId = context?.user?.id;
    if (!userId) return;
    const conversationId = z.uuid().parse((request.params as { id: string }).id);

    try {
      return { data: await getConversationMessages(userId, conversationId) };
    } catch (error) {
      return handleCommunicationError(reply, "/api/v1/conversations/:id/messages", error);
    }
  });

  app.post("/conversations/:id/messages", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/conversations/:id/messages");
    const userId = context?.user?.id;
    if (!userId) return;
    const conversationId = z.uuid().parse((request.params as { id: string }).id);
    const parsed = createMessageSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request is invalid", "/api/v1/conversations/:id/messages");
    }

    try {
      return reply.status(201).send({ data: await sendConversationMessage({ actorUserId: userId, conversationId, body: parsed.data.body }) });
    } catch (error) {
      return handleCommunicationError(reply, "/api/v1/conversations/:id/messages", error);
    }
  });

  app.post("/messages/:id/attachments", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/messages/:id/attachments");
    const userId = context?.user?.id;
    if (!userId) return;
    const messageId = z.uuid().parse((request.params as { id: string }).id);
    const parsed = messageAttachmentSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request is invalid", "/api/v1/messages/:id/attachments");
    }

    try {
      return reply.status(201).send({ data: await addMessageAttachment({ actorUserId: userId, messageId, ...parsed.data }) });
    } catch (error) {
      return handleCommunicationError(reply, "/api/v1/messages/:id/attachments", error);
    }
  });

  app.patch("/conversations/:id/read", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/conversations/:id/read");
    const userId = context?.user?.id;
    if (!userId) return;
    const conversationId = z.uuid().parse((request.params as { id: string }).id);

    try {
      return { data: await markConversationAsRead({ actorUserId: userId, conversationId }) };
    } catch (error) {
      return handleCommunicationError(reply, "/api/v1/conversations/:id/read", error);
    }
  });
}