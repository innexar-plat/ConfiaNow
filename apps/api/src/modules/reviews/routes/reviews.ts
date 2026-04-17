import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  addReviewEvidence,
  approveReview,
  createReview,
  listPendingReviewModerationQueue,
  listPublicBusinessReviews,
  rejectReview,
  requestMoreInfoForReview
} from "@platform/reviews";
import { getRequestContext } from "../../core/routes/auth-context";

const createReviewSchema = z.object({
  leadId: z.uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().min(3).max(120),
  comment: z.string().min(10).max(1500),
  evidenceNote: z.string().max(400).optional(),
  evidenceReference: z.string().max(300).optional()
});

const reviewEvidenceSchema = z.object({
  note: z.string().min(3).max(400),
  reference: z.string().max(300).optional()
});

const moderationSchema = z.object({
  decisionNote: z.string().max(500).optional()
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
  if (!context) return null;
  if (context.role !== "admin") {
    sendProblem(reply, 403, "https://platform.local/problems/forbidden", "Forbidden", "Admin role is required", instance);
    return null;
  }
  return context;
}

function handleReviewError(reply: FastifyReply, instance: string, error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (["CLIENT_ROLE_REQUIRED", "ADMIN_ROLE_REQUIRED"].includes(message)) {
    return sendProblem(reply, 403, "https://platform.local/problems/forbidden", "Forbidden", "Insufficient permissions", instance);
  }

  if (["REVIEW_ACCESS_FORBIDDEN"].includes(message)) {
    return sendProblem(reply, 403, "https://platform.local/problems/forbidden", "Forbidden", "Review access denied", instance);
  }

  if ([
    "INVALID_REVIEW_RATING",
    "LEAD_NOT_ELIGIBLE_FOR_REVIEW",
    "REVIEW_ALREADY_EXISTS",
    "REVIEW_EVIDENCE_NOT_ALLOWED",
    "REVIEW_MODERATION_NOT_ALLOWED"
  ].includes(message)) {
    return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request is invalid", instance);
  }

  if (message.endsWith("NOT_FOUND")) {
    return sendProblem(reply, 404, "https://platform.local/problems/not-found", "Not Found", "Requested resource was not found", instance);
  }

  return sendProblem(reply, 500, "https://platform.local/problems/internal-error", "Internal Server Error", "Unexpected error", instance);
}

export async function registerReviewRoutes(app: FastifyInstance) {
  app.post("/reviews", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/reviews");
    if (!context?.user?.id) return;
    const parsed = createReviewSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request is invalid", "/api/v1/reviews");
    }

    try {
      return reply.status(201).send({ data: await createReview({ clientUserId: context.user.id, ...parsed.data }) });
    } catch (error) {
      return handleReviewError(reply, "/api/v1/reviews", error);
    }
  });

  app.get("/businesses/:id/reviews", async (request, reply) => {
    const businessProfileId = z.uuid().parse((request.params as { id: string }).id);

    try {
      return { data: await listPublicBusinessReviews(businessProfileId) };
    } catch (error) {
      return handleReviewError(reply, "/api/v1/businesses/:id/reviews", error);
    }
  });

  app.get("/me/reviews/pending", async (request, reply) => {
    const context = await requireAdminContext(request, reply, "/api/v1/me/reviews/pending");
    if (!context?.user?.id) return;

    try {
      return { data: await listPendingReviewModerationQueue(context.user.id) };
    } catch (error) {
      return handleReviewError(reply, "/api/v1/me/reviews/pending", error);
    }
  });

  app.post("/reviews/:id/evidence", async (request, reply) => {
    const context = await requireAuthenticatedContext(request, reply, "/api/v1/reviews/:id/evidence");
    if (!context?.user?.id) return;
    const reviewId = z.uuid().parse((request.params as { id: string }).id);
    const parsed = reviewEvidenceSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request is invalid", "/api/v1/reviews/:id/evidence");
    }

    try {
      return reply.status(201).send({ data: await addReviewEvidence({ clientUserId: context.user.id, reviewId, ...parsed.data }) });
    } catch (error) {
      return handleReviewError(reply, "/api/v1/reviews/:id/evidence", error);
    }
  });

  app.post("/admin/reviews/:id/approve", async (request, reply) => {
    const context = await requireAdminContext(request, reply, "/api/v1/admin/reviews/:id/approve");
    if (!context?.user?.id) return;
    const reviewId = z.uuid().parse((request.params as { id: string }).id);
    const parsed = moderationSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request is invalid", "/api/v1/admin/reviews/:id/approve");
    }

    try {
      return { data: await approveReview({ adminUserId: context.user.id, reviewId, decisionNote: parsed.data.decisionNote }) };
    } catch (error) {
      return handleReviewError(reply, "/api/v1/admin/reviews/:id/approve", error);
    }
  });

  app.post("/admin/reviews/:id/request-more-info", async (request, reply) => {
    const context = await requireAdminContext(request, reply, "/api/v1/admin/reviews/:id/request-more-info");
    if (!context?.user?.id) return;
    const reviewId = z.uuid().parse((request.params as { id: string }).id);
    const parsed = moderationSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request is invalid", "/api/v1/admin/reviews/:id/request-more-info");
    }

    try {
      return { data: await requestMoreInfoForReview({ adminUserId: context.user.id, reviewId, decisionNote: parsed.data.decisionNote }) };
    } catch (error) {
      return handleReviewError(reply, "/api/v1/admin/reviews/:id/request-more-info", error);
    }
  });

  app.post("/admin/reviews/:id/reject", async (request, reply) => {
    const context = await requireAdminContext(request, reply, "/api/v1/admin/reviews/:id/reject");
    if (!context?.user?.id) return;
    const reviewId = z.uuid().parse((request.params as { id: string }).id);
    const parsed = moderationSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request is invalid", "/api/v1/admin/reviews/:id/reject");
    }

    try {
      return { data: await rejectReview({ adminUserId: context.user.id, reviewId, decisionNote: parsed.data.decisionNote }) };
    } catch (error) {
      return handleReviewError(reply, "/api/v1/admin/reviews/:id/reject", error);
    }
  });
}