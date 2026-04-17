import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  applyVerificationDecision,
  confirmOtpCode,
  createSessionFromCredentials,
  extractCookieValue,
  getAuthenticatedAccountFromAccessToken,
  getVerificationStatusForAccount,
  refreshSession,
  registerBusinessAccount,
  registerClientAccount,
  requestOtpCode,
  revokeSessionByRefreshToken,
  serializeAccessTokenCookie,
  serializeExpiredAuthCookies,
  serializeRefreshTokenCookie,
  uploadVerificationDocument
} from "@platform/auth";
import { getRequestContext } from "../../core/routes/auth-context";

const registerClientSchema = z.object({
  fullName: z.string().min(3).max(120),
  cpf: z.string().min(11),
  email: z.email(),
  phone: z.string().min(10),
  birthDate: z.string().min(10),
  password: z.string().min(8).max(128)
});

const registerBusinessSchema = z.object({
  businessName: z.string().min(3).max(160),
  legalRepresentativeName: z.string().min(3).max(120),
  legalRepresentativeCpf: z.string().min(11),
  cnpj: z.string().min(14),
  email: z.email(),
  phone: z.string().min(10),
  password: z.string().min(8).max(128)
});

const sessionSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128)
});

const otpConfirmSchema = z.object({
  code: z.string().length(6)
});

const documentSchema = z.object({
  documentType: z.string().min(2).max(80),
  fileName: z.string().min(3).max(200)
});

const adminDecisionSchema = z.object({
  note: z.string().max(400).optional()
});

function sendProblem(reply: FastifyReply, status: number, type: string, title: string, detail: string, instance: string) {
  return reply.status(status).send({
    type,
    title,
    status,
    detail,
    instance
  });
}

function applyAuthCookies(reply: FastifyReply, accessToken: string, refreshToken: string) {
  reply.header("Set-Cookie", [serializeAccessTokenCookie(accessToken), serializeRefreshTokenCookie(refreshToken)]);
}

function clearAuthCookies(reply: FastifyReply) {
  reply.header("Set-Cookie", serializeExpiredAuthCookies());
}

async function requireAuthenticatedAccount(request: FastifyRequest, reply: FastifyReply, instance: string) {
  const accessToken = extractCookieValue(request.headers.cookie, ACCESS_TOKEN_COOKIE);
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);

  if (!account) {
    sendProblem(reply, 401, "https://platform.local/problems/unauthorized", "Unauthorized", "Authentication is required to access this resource", instance);
    return null;
  }

  return account;
}

function handleAuthError(reply: FastifyReply, instance: string, error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (message === "IDENTITY_ALREADY_EXISTS") {
    return sendProblem(reply, 409, "https://platform.local/problems/conflict", "Conflict", "Account already exists", instance);
  }

  if (
    message.startsWith("INVALID_") ||
    message === "WEAK_PASSWORD" ||
    message === "OTP_INVALID" ||
    message === "OTP_EXPIRED"
  ) {
    return sendProblem(reply, 422, "https://platform.local/problems/validation-error", "Validation failed", "The request body is invalid", instance);
  }

  if (message === "INVALID_CREDENTIALS" || message === "SESSION_NOT_FOUND") {
    return sendProblem(reply, 401, "https://platform.local/problems/unauthorized", "Unauthorized", "Invalid credentials or session", instance);
  }

  if (message.endsWith("NOT_FOUND")) {
    return sendProblem(reply, 404, "https://platform.local/problems/not-found", "Not Found", "Requested resource was not found", instance);
  }

  return sendProblem(reply, 500, "https://platform.local/problems/internal-error", "Internal Server Error", "Unexpected error", instance);
}

export async function registerAuthenticationRoutes(app: FastifyInstance) {
  app.post("/auth/register/client", async (request, reply) => {
    const parsed = registerClientSchema.safeParse(request.body);

    if (!parsed.success) {
      return handleAuthError(reply, "/api/v1/auth/register/client", new Error("INVALID_CLIENT_REGISTRATION"));
    }

    try {
      const account = await registerClientAccount(parsed.data);
      const session = await createSessionFromCredentials({
        email: parsed.data.email,
        password: parsed.data.password,
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"]
      });
      applyAuthCookies(reply, session.accessToken, session.refreshToken);
      return reply.status(201).send({ data: account });
    } catch (error) {
      return handleAuthError(reply, "/api/v1/auth/register/client", error);
    }
  });

  app.post("/auth/register/business", async (request, reply) => {
    const parsed = registerBusinessSchema.safeParse(request.body);

    if (!parsed.success) {
      return handleAuthError(reply, "/api/v1/auth/register/business", new Error("INVALID_BUSINESS_REGISTRATION"));
    }

    try {
      const account = await registerBusinessAccount(parsed.data);
      const session = await createSessionFromCredentials({
        email: parsed.data.email,
        password: parsed.data.password,
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"]
      });
      applyAuthCookies(reply, session.accessToken, session.refreshToken);
      return reply.status(201).send({ data: account });
    } catch (error) {
      return handleAuthError(reply, "/api/v1/auth/register/business", error);
    }
  });

  app.post("/auth/sessions", async (request, reply) => {
    const parsed = sessionSchema.safeParse(request.body);

    if (!parsed.success) {
      return handleAuthError(reply, "/api/v1/auth/sessions", new Error("INVALID_CREDENTIALS"));
    }

    try {
      const session = await createSessionFromCredentials({
        ...parsed.data,
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"]
      });
      applyAuthCookies(reply, session.accessToken, session.refreshToken);
      return reply.status(201).send({ data: session.account });
    } catch (error) {
      return handleAuthError(reply, "/api/v1/auth/sessions", error);
    }
  });

  app.delete("/auth/sessions/current", async (request, reply) => {
    const refreshToken = extractCookieValue(request.headers.cookie, REFRESH_TOKEN_COOKIE);
    await revokeSessionByRefreshToken(refreshToken);
    clearAuthCookies(reply);
    return reply.status(204).send();
  });

  app.post("/auth/refresh", async (request, reply) => {
    const refreshToken = extractCookieValue(request.headers.cookie, REFRESH_TOKEN_COOKIE);

    try {
      const session = await refreshSession({
        refreshToken: refreshToken ?? "",
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"]
      });
      applyAuthCookies(reply, session.accessToken, session.refreshToken);
      return { data: session.account };
    } catch (error) {
      return handleAuthError(reply, "/api/v1/auth/refresh", error);
    }
  });

  app.post("/auth/verify-email/request", async (request, reply) => {
    const account = await requireAuthenticatedAccount(request, reply, "/api/v1/auth/verify-email/request");

    if (!account) {
      return;
    }

    try {
      return { data: await requestOtpCode({ userId: account.id, channel: "email" }) };
    } catch (error) {
      return handleAuthError(reply, "/api/v1/auth/verify-email/request", error);
    }
  });

  app.post("/auth/verify-email/confirm", async (request, reply) => {
    const account = await requireAuthenticatedAccount(request, reply, "/api/v1/auth/verify-email/confirm");

    if (!account) {
      return;
    }

    const parsed = otpConfirmSchema.safeParse(request.body);

    if (!parsed.success) {
      return handleAuthError(reply, "/api/v1/auth/verify-email/confirm", new Error("OTP_INVALID"));
    }

    try {
      return { data: await confirmOtpCode({ userId: account.id, channel: "email", code: parsed.data.code }) };
    } catch (error) {
      return handleAuthError(reply, "/api/v1/auth/verify-email/confirm", error);
    }
  });

  app.post("/auth/verify-phone/request", async (request, reply) => {
    const account = await requireAuthenticatedAccount(request, reply, "/api/v1/auth/verify-phone/request");

    if (!account) {
      return;
    }

    try {
      return { data: await requestOtpCode({ userId: account.id, channel: "phone" }) };
    } catch (error) {
      return handleAuthError(reply, "/api/v1/auth/verify-phone/request", error);
    }
  });

  app.post("/auth/verify-phone/confirm", async (request, reply) => {
    const account = await requireAuthenticatedAccount(request, reply, "/api/v1/auth/verify-phone/confirm");

    if (!account) {
      return;
    }

    const parsed = otpConfirmSchema.safeParse(request.body);

    if (!parsed.success) {
      return handleAuthError(reply, "/api/v1/auth/verify-phone/confirm", new Error("OTP_INVALID"));
    }

    try {
      return { data: await confirmOtpCode({ userId: account.id, channel: "phone", code: parsed.data.code }) };
    } catch (error) {
      return handleAuthError(reply, "/api/v1/auth/verify-phone/confirm", error);
    }
  });

  app.post("/auth/documents", async (request, reply) => {
    const account = await requireAuthenticatedAccount(request, reply, "/api/v1/auth/documents");

    if (!account) {
      return;
    }

    const parsed = documentSchema.safeParse(request.body);

    if (!parsed.success) {
      return handleAuthError(reply, "/api/v1/auth/documents", new Error("INVALID_DOCUMENT"));
    }

    try {
      return { data: await uploadVerificationDocument({ userId: account.id, ...parsed.data }) };
    } catch (error) {
      return handleAuthError(reply, "/api/v1/auth/documents", error);
    }
  });

  app.get("/auth/verification-status", async (request, reply) => {
    const account = await requireAuthenticatedAccount(request, reply, "/api/v1/auth/verification-status");

    if (!account) {
      return;
    }

    try {
      return { data: await getVerificationStatusForAccount(account.id) };
    } catch (error) {
      return handleAuthError(reply, "/api/v1/auth/verification-status", error);
    }
  });

  app.post("/admin/verifications/:id/approve", async (request, reply) => {
    const context = await getRequestContext(request);

    if (context.role !== "admin" || !context.user) {
      return sendProblem(reply, 403, "https://platform.local/problems/forbidden", "Forbidden", "Administrator access is required to access this resource", request.url);
    }

    const parsed = adminDecisionSchema.safeParse(request.body ?? {});

    try {
      return {
        data: await applyVerificationDecision({
          verificationRequestId: (request.params as { id: string }).id,
          action: "approve",
          actorUserId: context.user.id,
          note: parsed.success ? parsed.data.note : undefined
        })
      };
    } catch (error) {
      return handleAuthError(reply, request.url, error);
    }
  });

  app.post("/admin/verifications/:id/request-more-info", async (request, reply) => {
    const context = await getRequestContext(request);

    if (context.role !== "admin" || !context.user) {
      return sendProblem(reply, 403, "https://platform.local/problems/forbidden", "Forbidden", "Administrator access is required to access this resource", request.url);
    }

    const parsed = adminDecisionSchema.safeParse(request.body ?? {});

    try {
      return {
        data: await applyVerificationDecision({
          verificationRequestId: (request.params as { id: string }).id,
          action: "request_more_info",
          actorUserId: context.user.id,
          note: parsed.success ? parsed.data.note : undefined
        })
      };
    } catch (error) {
      return handleAuthError(reply, request.url, error);
    }
  });

  app.post("/admin/verifications/:id/reject", async (request, reply) => {
    const context = await getRequestContext(request);

    if (context.role !== "admin" || !context.user) {
      return sendProblem(reply, 403, "https://platform.local/problems/forbidden", "Forbidden", "Administrator access is required to access this resource", request.url);
    }

    const parsed = adminDecisionSchema.safeParse(request.body ?? {});

    try {
      return {
        data: await applyVerificationDecision({
          verificationRequestId: (request.params as { id: string }).id,
          action: "reject",
          actorUserId: context.user.id,
          note: parsed.success ? parsed.data.note : undefined
        })
      };
    } catch (error) {
      return handleAuthError(reply, request.url, error);
    }
  });
}