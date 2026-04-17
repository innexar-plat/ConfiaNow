import "dotenv/config";
import { createHash, randomInt, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import {
  OtpChannel,
  Prisma,
  UserRole,
  VerificationStatus as PrismaVerificationStatus
} from "@prisma/client";
import { prisma } from "../../database/src";

export const ACCESS_TOKEN_COOKIE = "platform_access_token";
export const REFRESH_TOKEN_COOKIE = "platform_refresh_token";

type RuntimeRole = "client" | "business" | "admin";
export type RuntimeVerificationStatus =
  | "pending_contact_verification"
  | "pending_document_submission"
  | "pending_review"
  | "more_info_required"
  | "approved"
  | "rejected";

type AccessTokenPayload = {
  sub: string;
  role: RuntimeRole;
  type: "access";
};

export type AuthenticatedAccount = {
  id: string;
  role: RuntimeRole;
  fullName: string;
  displayName: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  verificationStatus: RuntimeVerificationStatus;
};

export type VerificationStatusView = {
  account: AuthenticatedAccount;
  verificationRequestId: string;
  documents: Array<{
    id: string;
    documentType: string;
    fileName: string;
    uploadedAt: string;
  }>;
  notes: string | null;
};

const ACCESS_TOKEN_TTL_MINUTES = Number(process.env.ACCESS_TOKEN_TTL_MINUTES ?? 15);
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30);
const accessSecret = process.env.JWT_ACCESS_SECRET ?? "troque-esta-chave-de-acesso";
const refreshSecret = process.env.JWT_REFRESH_SECRET ?? "troque-esta-chave-de-refresh";

function toRuntimeRole(role: UserRole): RuntimeRole {
  if (role === UserRole.CLIENT) {
    return "client";
  }

  if (role === UserRole.BUSINESS) {
    return "business";
  }

  return "admin";
}

function toPrismaRole(role: RuntimeRole) {
  if (role === "client") {
    return UserRole.CLIENT;
  }

  if (role === "business") {
    return UserRole.BUSINESS;
  }

  return UserRole.ADMIN;
}

function toRuntimeVerificationStatus(status: PrismaVerificationStatus): RuntimeVerificationStatus {
  switch (status) {
    case PrismaVerificationStatus.PENDING_CONTACT_VERIFICATION:
      return "pending_contact_verification";
    case PrismaVerificationStatus.PENDING_DOCUMENT_SUBMISSION:
      return "pending_document_submission";
    case PrismaVerificationStatus.PENDING_REVIEW:
      return "pending_review";
    case PrismaVerificationStatus.MORE_INFO_REQUIRED:
      return "more_info_required";
    case PrismaVerificationStatus.APPROVED:
      return "approved";
    case PrismaVerificationStatus.REJECTED:
      return "rejected";
  }
}

function toPrismaVerificationStatus(status: RuntimeVerificationStatus) {
  switch (status) {
    case "pending_contact_verification":
      return PrismaVerificationStatus.PENDING_CONTACT_VERIFICATION;
    case "pending_document_submission":
      return PrismaVerificationStatus.PENDING_DOCUMENT_SUBMISSION;
    case "pending_review":
      return PrismaVerificationStatus.PENDING_REVIEW;
    case "more_info_required":
      return PrismaVerificationStatus.MORE_INFO_REQUIRED;
    case "approved":
      return PrismaVerificationStatus.APPROVED;
    case "rejected":
      return PrismaVerificationStatus.REJECTED;
  }
}

function hashPassword(password: string) {
  const salt = randomUUID();
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

function verifyPassword(password: string, hash: string) {
  const [salt, storedHash] = hash.split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, 64);
  const source = Buffer.from(storedHash, "hex");

  return source.length === derivedKey.length && timingSafeEqual(source, derivedKey);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

function signAccessToken(account: AuthenticatedAccount) {
  return jwt.sign(
    {
      sub: account.id,
      role: account.role,
      type: "access"
    } satisfies AccessTokenPayload,
    accessSecret,
    {
      expiresIn: `${ACCESS_TOKEN_TTL_MINUTES}m`
    }
  );
}

function createRefreshToken() {
  return jwt.sign({ type: "refresh", nonce: randomUUID() }, refreshSecret, {
    expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d`
  });
}

export function serializeAccessTokenCookie(token: string) {
  return `${ACCESS_TOKEN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ACCESS_TOKEN_TTL_MINUTES * 60}`;
}

export function serializeRefreshTokenCookie(token: string) {
  return `${REFRESH_TOKEN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60}`;
}

export function serializeExpiredAuthCookies() {
  return [
    `${ACCESS_TOKEN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    `${REFRESH_TOKEN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  ];
}

export function extractCookieValue(cookieHeader: string | undefined, cookieName: string) {
  if (!cookieHeader) {
    return undefined;
  }

  const item = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));

  return item ? item.slice(cookieName.length + 1) : undefined;
}

export function getSeededAdminCredentials() {
  return {
    email: "admin@plataforma.local",
    password: "Admin12345!"
  };
}

function mapAccount(user: {
  id: string;
  role: UserRole;
  fullName: string;
  displayName: string;
  email: string;
  phone: string;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  verificationStatus: PrismaVerificationStatus;
}): AuthenticatedAccount {
  return {
    id: user.id,
    role: toRuntimeRole(user.role),
    fullName: user.fullName,
    displayName: user.displayName,
    email: user.email,
    phone: user.phone,
    emailVerified: Boolean(user.emailVerifiedAt),
    phoneVerified: Boolean(user.phoneVerifiedAt),
    verificationStatus: toRuntimeVerificationStatus(user.verificationStatus)
  };
}

async function createAuditLog(input: {
  action: string;
  actorUserId?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({
    data: {
      action: input.action,
      actorUserId: input.actorUserId,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata
    }
  });
}

async function issueSession(user: AuthenticatedAccount, sessionMeta?: { ipAddress?: string; userAgent?: string }) {
  const refreshToken = createRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash,
      expiresAt,
      ipAddress: sessionMeta?.ipAddress,
      userAgent: sessionMeta?.userAgent
    }
  });

  return {
    accessToken: signAccessToken(user),
    refreshToken
  };
}

async function getOrCreateVerificationRequest(userId: string, status: PrismaVerificationStatus) {
  return prisma.verificationRequest.upsert({
    where: { userId },
    update: { status },
    create: { userId, status }
  });
}

async function recomputeVerificationState(userId: string) {
  const request = await prisma.verificationRequest.findUnique({
    where: { userId },
    include: { documents: true }
  });
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!request || !user) {
    throw new Error("ACCOUNT_NOT_FOUND");
  }

  if (request.status === PrismaVerificationStatus.APPROVED || request.status === PrismaVerificationStatus.REJECTED) {
    return;
  }

  let status: PrismaVerificationStatus = PrismaVerificationStatus.PENDING_CONTACT_VERIFICATION;

  if (user.emailVerifiedAt && user.phoneVerifiedAt) {
    status = request.documents.length > 0
      ? PrismaVerificationStatus.PENDING_REVIEW
      : PrismaVerificationStatus.PENDING_DOCUMENT_SUBMISSION;
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { verificationStatus: status } }),
    prisma.verificationRequest.update({ where: { userId }, data: { status } })
  ]);
}

export function isValidCpf(value: string) {
  const cpf = normalizeDigits(value);

  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(cpf[index]) * (10 - index);
  }

  let remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }

  if (remainder !== Number(cpf[9])) {
    return false;
  }

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(cpf[index]) * (11 - index);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }

  return remainder === Number(cpf[10]);
}

export function isValidCnpj(value: string) {
  const cnpj = normalizeDigits(value);

  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  const calculateDigit = (base: string, factors: number[]) => {
    const total = base.split("").reduce((sum, digit, index) => sum + Number(digit) * factors[index], 0);
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calculateDigit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateDigit(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return firstDigit === Number(cnpj[12]) && secondDigit === Number(cnpj[13]);
}

export async function registerClientAccount(input: {
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: string;
  password: string;
}) {
  if (!isValidCpf(input.cpf)) {
    throw new Error("INVALID_CPF");
  }

  if (input.password.length < 8) {
    throw new Error("WEAK_PASSWORD");
  }

  const email = input.email.trim().toLowerCase();
  const phone = normalizeDigits(input.phone);
  const cpf = normalizeDigits(input.cpf);

  try {
    const created = await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          role: UserRole.CLIENT,
          fullName: input.fullName.trim(),
          displayName: input.fullName.trim(),
          email,
          phone,
          cpf,
          birthDate: new Date(input.birthDate),
          passwordHash: hashPassword(input.password),
          verificationStatus: PrismaVerificationStatus.PENDING_CONTACT_VERIFICATION
        }
      });

      await transaction.verificationRequest.create({
        data: {
          userId: user.id,
          status: PrismaVerificationStatus.PENDING_CONTACT_VERIFICATION
        }
      });

      return user;
    });

    await createAuditLog({ action: "auth.register.client", actorUserId: created.id, entityType: "user", entityId: created.id });
    return mapAccount(created);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("IDENTITY_ALREADY_EXISTS");
    }

    throw error;
  }
}

export async function registerBusinessAccount(input: {
  businessName: string;
  legalRepresentativeName: string;
  legalRepresentativeCpf: string;
  cnpj: string;
  email: string;
  phone: string;
  password: string;
}) {
  if (!isValidCnpj(input.cnpj)) {
    throw new Error("INVALID_CNPJ");
  }

  if (!isValidCpf(input.legalRepresentativeCpf)) {
    throw new Error("INVALID_LEGAL_REPRESENTATIVE_CPF");
  }

  if (input.password.length < 8) {
    throw new Error("WEAK_PASSWORD");
  }

  const email = input.email.trim().toLowerCase();
  const phone = normalizeDigits(input.phone);
  const cnpj = normalizeDigits(input.cnpj);
  const legalRepresentativeCpf = normalizeDigits(input.legalRepresentativeCpf);

  try {
    const created = await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          role: UserRole.BUSINESS,
          fullName: input.legalRepresentativeName.trim(),
          displayName: input.businessName.trim(),
          email,
          phone,
          cnpj,
          businessName: input.businessName.trim(),
          legalRepresentativeName: input.legalRepresentativeName.trim(),
          legalRepresentativeCpf,
          passwordHash: hashPassword(input.password),
          verificationStatus: PrismaVerificationStatus.PENDING_CONTACT_VERIFICATION,
          businessOwner: {
            create: {
              fullName: input.legalRepresentativeName.trim(),
              cpf: legalRepresentativeCpf
            }
          }
        }
      });

      await transaction.verificationRequest.create({
        data: {
          userId: user.id,
          status: PrismaVerificationStatus.PENDING_CONTACT_VERIFICATION
        }
      });

      return user;
    });

    await createAuditLog({ action: "auth.register.business", actorUserId: created.id, entityType: "user", entityId: created.id });
    return mapAccount(created);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("IDENTITY_ALREADY_EXISTS");
    }

    throw error;
  }
}

export async function createSessionFromCredentials(input: {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.trim().toLowerCase() }
  });

  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const account = mapAccount(user);
  const tokens = await issueSession(account, {
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });
  await createAuditLog({ action: "auth.session.created", actorUserId: user.id, entityType: "session", entityId: user.id });

  return {
    account,
    ...tokens
  };
}

export async function getAuthenticatedAccountFromAccessToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, accessSecret) as AccessTokenPayload;

    if (payload.type !== "access") {
      return null;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    return user ? mapAccount(user) : null;
  } catch {
    return null;
  }
}

export async function refreshSession(input: { refreshToken: string; ipAddress?: string; userAgent?: string }) {
  try {
    jwt.verify(input.refreshToken, refreshSecret);
  } catch {
    throw new Error("SESSION_NOT_FOUND");
  }

  const session = await prisma.session.findUnique({
    where: { refreshTokenHash: hashToken(input.refreshToken) },
    include: { user: true }
  });

  if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    throw new Error("SESSION_NOT_FOUND");
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { revokedAt: new Date() }
  });

  const account = mapAccount(session.user);
  const tokens = await issueSession(account, {
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });
  await createAuditLog({ action: "auth.session.refreshed", actorUserId: session.userId, entityType: "session", entityId: session.id });

  return {
    account,
    ...tokens
  };
}

export async function revokeSessionByRefreshToken(refreshToken: string | undefined) {
  if (!refreshToken) {
    return;
  }

  await prisma.session.updateMany({
    where: {
      refreshTokenHash: hashToken(refreshToken),
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  });
}

export async function requestOtpCode(input: { userId: string; channel: "email" | "phone" }) {
  const user = await prisma.user.findUnique({ where: { id: input.userId } });

  if (!user) {
    throw new Error("ACCOUNT_NOT_FOUND");
  }

  const code = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.otpCode.updateMany({
    where: {
      userId: input.userId,
      channel: input.channel === "email" ? OtpChannel.EMAIL : OtpChannel.PHONE,
      consumedAt: null
    },
    data: {
      consumedAt: new Date()
    }
  });

  await prisma.otpCode.create({
    data: {
      userId: input.userId,
      channel: input.channel === "email" ? OtpChannel.EMAIL : OtpChannel.PHONE,
      codeHash: hashToken(code),
      expiresAt
    }
  });

  await createAuditLog({ action: `auth.otp.requested.${input.channel}`, actorUserId: input.userId, entityType: "otp", entityId: input.userId });

  return {
    channel: input.channel,
    expiresAt: expiresAt.toISOString(),
    devCode: code
  };
}

export async function confirmOtpCode(input: { userId: string; channel: "email" | "phone"; code: string }) {
  const record = await prisma.otpCode.findFirst({
    where: {
      userId: input.userId,
      channel: input.channel === "email" ? OtpChannel.EMAIL : OtpChannel.PHONE,
      consumedAt: null
    },
    orderBy: { createdAt: "desc" }
  });

  if (!record) {
    throw new Error("OTP_NOT_FOUND");
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    throw new Error("OTP_EXPIRED");
  }

  if (record.codeHash !== hashToken(input.code.trim())) {
    throw new Error("OTP_INVALID");
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.otpCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() }
    });

    await transaction.user.update({
      where: { id: input.userId },
      data: input.channel === "email" ? { emailVerifiedAt: new Date() } : { phoneVerifiedAt: new Date() }
    });
  });

  await recomputeVerificationState(input.userId);
  await createAuditLog({ action: `auth.otp.confirmed.${input.channel}`, actorUserId: input.userId, entityType: "otp", entityId: record.id });
  return getVerificationStatusForAccount(input.userId);
}

export async function uploadVerificationDocument(input: {
  userId: string;
  documentType: string;
  fileName: string;
}) {
  const request = await getOrCreateVerificationRequest(input.userId, PrismaVerificationStatus.PENDING_CONTACT_VERIFICATION);
  await prisma.verificationDocument.create({
    data: {
      verificationRequestId: request.id,
      documentType: input.documentType,
      fileName: input.fileName
    }
  });
  await recomputeVerificationState(input.userId);
  await createAuditLog({ action: "auth.document.uploaded", actorUserId: input.userId, entityType: "verification_request", entityId: request.id });
  return getVerificationStatusForAccount(input.userId);
}

export async function getVerificationStatusForAccount(userId: string): Promise<VerificationStatusView> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const request = await prisma.verificationRequest.findUnique({
    where: { userId },
    include: { documents: { orderBy: { createdAt: "desc" } } }
  });

  if (!user || !request) {
    throw new Error("ACCOUNT_NOT_FOUND");
  }

  return {
    account: mapAccount(user),
    verificationRequestId: request.id,
    documents: request.documents.map((document) => ({
      id: document.id,
      documentType: document.documentType,
      fileName: document.fileName,
      uploadedAt: document.createdAt.toISOString()
    })),
    notes: request.notes
  };
}

export async function applyVerificationDecision(input: {
  verificationRequestId: string;
  action: "approve" | "request_more_info" | "reject";
  actorUserId: string;
  note?: string;
}) {
  const request = await prisma.verificationRequest.findUnique({ where: { id: input.verificationRequestId } });

  if (!request) {
    throw new Error("VERIFICATION_REQUEST_NOT_FOUND");
  }

  const nextStatus: RuntimeVerificationStatus =
    input.action === "approve"
      ? "approved"
      : input.action === "request_more_info"
        ? "more_info_required"
        : "rejected";

  await prisma.$transaction([
    prisma.verificationRequest.update({
      where: { id: request.id },
      data: {
        status: toPrismaVerificationStatus(nextStatus),
        notes: input.note ?? null,
        reviewedAt: new Date(),
        reviewedBy: input.actorUserId
      }
    }),
    prisma.user.update({
      where: { id: request.userId },
      data: {
        verificationStatus: toPrismaVerificationStatus(nextStatus)
      }
    })
  ]);

  await createAuditLog({
    action: `auth.verification.${input.action}`,
    actorUserId: input.actorUserId,
    entityType: "verification_request",
    entityId: request.id,
    metadata: input.note ? { note: input.note } : undefined
  });

  return getVerificationStatusForAccount(request.userId);
}

export function getUserPermissions(role: RuntimeRole) {
  if (role === "client") {
    return ["leads:create", "reviews:create", "profile:read"];
  }

  if (role === "business") {
    return ["business:manage", "leads:reply", "reviews:read", "badge:read"];
  }

  return [
    "settings:read",
    "settings:write",
    "audit-logs:read",
    "verifications:manage",
    "reviews:moderate"
  ];
}
