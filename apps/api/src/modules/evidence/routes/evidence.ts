import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { EvidenceTargetType, StoredFilePurpose } from "@prisma/client";
import { z } from "zod";
import {
  createEvidenceLink,
  createStoredFile,
  deleteStoredFile,
  getStoredFileById,
  listMyDocuments,
  resubmitMyDocument
} from "@platform/evidence";
import { getRequestContext } from "../../core/routes/auth-context";

const fileSchema = z.object({
  originalName: z.string().min(2).max(160),
  mimeType: z.string().min(3).max(120),
  sizeBytes: z.coerce.number().int().min(1).max(10 * 1024 * 1024),
  storageUrl: z.string().url().max(400),
  checksumSha256: z.string().max(200).optional(),
  purpose: z.nativeEnum(StoredFilePurpose).optional()
});

const evidenceLinkSchema = z.object({
  fileId: z.uuid(),
  targetType: z.nativeEnum(EvidenceTargetType),
  targetId: z.uuid(),
  description: z.string().max(280).optional()
});

function sendProblem(reply: FastifyReply, status: number, type: string, title: string, detail: string, instance: string) {
  return reply.status(status).send({ type, title, status, detail, instance });
}

async function requireAuthenticatedContext(request: FastifyRequest, reply: FastifyReply, instance: string) {
  const context = await getRequestContext(request);

  if (!context.user?.id || !context.user.role) {
    sendProblem(reply, 401, "https://platform.local/problems/unauthorized", "Unauthorized", "Authentication is required", instance);
    return null;
  }

  return context;
}

function handleEvidenceError(reply: FastifyReply, instance: string, error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (message === "FILE_NOT_FOUND" || message === "DOCUMENT_NOT_FOUND" || message === "EVIDENCE_TARGET_NOT_FOUND") {
    return sendProblem(reply, 404, "https://platform.local/problems/not-found", "Not Found", "Requested resource was not found", instance);
  }

  if (message === "FILE_ACCESS_FORBIDDEN" || message === "DOCUMENT_ACCESS_FORBIDDEN") {
    return sendProblem(reply, 403, "https://platform.local/problems/forbidden", "Forbidden", "You do not have access to this resource", instance);
  }

  if (
    [
      "INVALID_FILE_NAME",
      "INVALID_MIME_TYPE",
      "INVALID_FILE_SIZE",
      "INVALID_STORAGE_URL",
      "INVALID_CHECKSUM",
      "FILE_ALREADY_DELETED"
    ].includes(message)
  ) {
    return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request is invalid", instance);
  }

  return sendProblem(reply, 500, "https://platform.local/problems/internal-error", "Internal Server Error", "Unexpected error", instance);
}

export async function registerEvidenceRoutes(app: FastifyInstance) {
  app.post("/files", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/files");

    if (!context?.user?.id || !context.user.role) {
      return;
    }

    const parsed = fileSchema.safeParse(request.body);

    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request is invalid", "/api/v1/files");
    }

    try {
      const data = await createStoredFile({ actorUserId: context.user.id, ...parsed.data });
      return reply.status(201).send({ data });
    } catch (error) {
      return handleEvidenceError(reply, "/api/v1/files", error);
    }
  });

  app.get("/files/:id", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/files/:id");

    if (!context?.user?.id || !context.user.role) {
      return;
    }

    try {
      const data = await getStoredFileById({
        actorUserId: context.user.id,
        actorRole: context.user.role as "client" | "business" | "admin",
        fileId: z.uuid().parse((request.params as { id: string }).id)
      });
      return { data };
    } catch (error) {
      return handleEvidenceError(reply, "/api/v1/files/:id", error);
    }
  });

  app.delete("/files/:id", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/files/:id");

    if (!context?.user?.id || !context.user.role) {
      return;
    }

    try {
      const data = await deleteStoredFile({
        actorUserId: context.user.id,
        actorRole: context.user.role as "client" | "business" | "admin",
        fileId: z.uuid().parse((request.params as { id: string }).id)
      });
      return { data };
    } catch (error) {
      return handleEvidenceError(reply, "/api/v1/files/:id", error);
    }
  });

  app.post("/evidence-links", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/evidence-links");

    if (!context?.user?.id) {
      return;
    }

    const parsed = evidenceLinkSchema.safeParse(request.body);

    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request is invalid", "/api/v1/evidence-links");
    }

    try {
      const data = await createEvidenceLink({ actorUserId: context.user.id, ...parsed.data });
      return reply.status(201).send({ data });
    } catch (error) {
      return handleEvidenceError(reply, "/api/v1/evidence-links", error);
    }
  });

  app.get("/me/documents", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/me/documents");

    if (!context?.user?.id) {
      return;
    }

    try {
      const data = await listMyDocuments(context.user.id);
      return { data };
    } catch (error) {
      return handleEvidenceError(reply, "/api/v1/me/documents", error);
    }
  });

  app.post("/me/documents/:id/resubmit", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/me/documents/:id/resubmit");

    if (!context?.user?.id) {
      return;
    }

    const parsed = fileSchema.safeParse(request.body);

    if (!parsed.success) {
      return sendProblem(
        reply,
        422,
        "https://platform.local/problems/validation-error",
        "Validation failed",
        "The request is invalid",
        "/api/v1/me/documents/:id/resubmit"
      );
    }

    try {
      const data = await resubmitMyDocument({
        actorUserId: context.user.id,
        documentId: z.uuid().parse((request.params as { id: string }).id),
        ...parsed.data
      });
      return { data };
    } catch (error) {
      return handleEvidenceError(reply, "/api/v1/me/documents/:id/resubmit", error);
    }
  });
}
