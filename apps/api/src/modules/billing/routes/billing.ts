import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  cancelCurrentSubscription,
  createBoostCheckout,
  createSubscriptionCheckout,
  getCurrentSubscription,
  handleBillingWebhook,
  listBillingInvoices,
  listCurrentBoosts,
  listPlans,
  updateCurrentSubscription
} from "@platform/billing";
import { getRequestContext } from "../../core/routes/auth-context";

const subscriptionBodySchema = z.object({
  planCode: z.string().min(3).max(40)
});

const boostBodySchema = z.object({
  durationDays: z.coerce.number().int().min(3).max(30).optional()
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

async function requireBusinessContext(request: FastifyRequest, reply: FastifyReply, instance: string) {
  const context = await requireAuthenticatedContext(request, reply, instance);

  if (!context) {
    return null;
  }

  if (context.role !== "business") {
    sendProblem(reply, 403, "https://platform.local/problems/forbidden", "Forbidden", "Business access is required", instance);
    return null;
  }

  return context;
}

function handleBillingError(reply: FastifyReply, instance: string, error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (["BUSINESS_ROLE_REQUIRED"].includes(message)) {
    return sendProblem(reply, 403, "https://platform.local/problems/forbidden", "Forbidden", "Business access is required", instance);
  }

  if (["USER_NOT_FOUND", "SUBSCRIPTION_NOT_FOUND", "PAYMENT_NOT_FOUND"].includes(message)) {
    return sendProblem(reply, 404, "https://platform.local/problems/not-found", "Not Found", "Requested resource was not found", instance);
  }

  if (["INVALID_PLAN_CODE", "FREE_PLAN_NOT_ALLOWED", "PLAN_ALREADY_ACTIVE", "SUBSCRIPTION_ALREADY_EXISTS", "BOOST_PLAN_NOT_ELIGIBLE", "PAYMENT_ID_REQUIRED"].includes(message)) {
    return sendProblem(reply, 409, "https://platform.local/problems/conflict", "Conflict", "Requested billing operation is not allowed in the current state", instance);
  }

  if (["WEBHOOK_SIGNATURE_INVALID"].includes(message)) {
    return sendProblem(reply, 401, "https://platform.local/problems/unauthorized", "Unauthorized", "Webhook signature is invalid", instance);
  }

  if (["WEBHOOK_TIMESTAMP_INVALID", "WEBHOOK_PAYLOAD_INVALID"].includes(message)) {
    return sendProblem(reply, 400, "https://platform.local/problems/bad-request", "Bad Request", "Webhook payload is invalid", instance);
  }

  return sendProblem(reply, 500, "https://platform.local/problems/internal-error", "Internal Server Error", "Unexpected error", instance);
}

export async function registerBillingRoutes(app: FastifyInstance) {
  app.get("/plans", async () => {
    return { data: await listPlans() };
  });

  app.post("/subscriptions", async (request, reply) => {
    const context = await requireBusinessContext(request, reply, "/api/v1/subscriptions");
    if (!context?.user?.id) return;

    const parsed = subscriptionBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request body is invalid", "/api/v1/subscriptions");
    }

    try {
      return reply.status(201).send(await createSubscriptionCheckout({ userId: context.user.id, ...parsed.data }));
    } catch (error) {
      return handleBillingError(reply, "/api/v1/subscriptions", error);
    }
  });

  app.get("/subscriptions/current", async (request, reply) => {
    const context = await requireBusinessContext(request, reply, "/api/v1/subscriptions/current");
    if (!context?.user?.id) return;

    try {
      return { data: await getCurrentSubscription(context.user.id) };
    } catch (error) {
      return handleBillingError(reply, "/api/v1/subscriptions/current", error);
    }
  });

  app.patch("/subscriptions/current", async (request, reply) => {
    const context = await requireBusinessContext(request, reply, "/api/v1/subscriptions/current");
    if (!context?.user?.id) return;

    const parsed = subscriptionBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request body is invalid", "/api/v1/subscriptions/current");
    }

    try {
      return { data: await updateCurrentSubscription({ userId: context.user.id, ...parsed.data }) };
    } catch (error) {
      return handleBillingError(reply, "/api/v1/subscriptions/current", error);
    }
  });

  app.post("/subscriptions/current/cancel", async (request, reply) => {
    const context = await requireBusinessContext(request, reply, "/api/v1/subscriptions/current/cancel");
    if (!context?.user?.id) return;

    try {
      return { data: await cancelCurrentSubscription(context.user.id) };
    } catch (error) {
      return handleBillingError(reply, "/api/v1/subscriptions/current/cancel", error);
    }
  });

  app.get("/billing/invoices", async (request, reply) => {
    const context = await requireBusinessContext(request, reply, "/api/v1/billing/invoices");
    if (!context?.user?.id) return;

    try {
      return await listBillingInvoices(context.user.id);
    } catch (error) {
      return handleBillingError(reply, "/api/v1/billing/invoices", error);
    }
  });

  app.post("/boosts", async (request, reply) => {
    const context = await requireBusinessContext(request, reply, "/api/v1/boosts");
    if (!context?.user?.id) return;

    const parsed = boostBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request body is invalid", "/api/v1/boosts");
    }

    try {
      return reply.status(201).send(await createBoostCheckout({ userId: context.user.id, ...parsed.data }));
    } catch (error) {
      return handleBillingError(reply, "/api/v1/boosts", error);
    }
  });

  app.get("/boosts/current", async (request, reply) => {
    const context = await requireBusinessContext(request, reply, "/api/v1/boosts/current");
    if (!context?.user?.id) return;

    try {
      return await listCurrentBoosts(context.user.id);
    } catch (error) {
      return handleBillingError(reply, "/api/v1/boosts/current", error);
    }
  });

  app.post("/webhooks/billing-provider", async (request, reply) => {
    const timestamp = request.headers["x-billing-timestamp"];
    const signature = request.headers["x-billing-signature"];
    const payload = typeof request.body === "string" ? request.body : JSON.stringify(request.body ?? {});

    if (typeof timestamp !== "string" || typeof signature !== "string") {
      return sendProblem(reply, 400, "https://platform.local/problems/bad-request", "Bad Request", "Webhook signature headers are required", "/api/v1/webhooks/billing-provider");
    }

    try {
      return { data: await handleBillingWebhook({ payload, timestamp, signature }) };
    } catch (error) {
      return handleBillingError(reply, "/api/v1/webhooks/billing-provider", error);
    }
  });
}
