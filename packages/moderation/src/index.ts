import "dotenv/config";
import { ModerationCaseStatus, ModerationCaseType, VerificationStatus } from "@prisma/client";
import { prisma } from "../../database/src";

export type { ModerationCaseStatus, ModerationCaseType };

export type ModerationCaseView = {
  id: string;
  type: ModerationCaseType;
  status: ModerationCaseStatus;
  reporterUserId: string | null;
  targetType: string;
  targetId: string;
  description: string;
  internalNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  decisions: Array<{
    id: string;
    adminUserId: string;
    decision: string;
    note: string | null;
    createdAt: string;
  }>;
};

export type VerificationRequestSummary = {
  id: string;
  userId: string;
  status: string;
  notes: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  userName: string;
  userEmail: string;
};

export type AdminBusinessView = {
  id: string;
  slug: string;
  businessName: string;
  headline: string | null;
  description: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
  city: string | null;
  state: string | null;
  isPublished: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    verificationStatus: string;
    cnpj: string | null;
  };
  trustScore: {
    score: number;
    badgeLevel: string | null;
    isSuspended: boolean;
  } | null;
  pendingReviewsCount: number;
};

export type PaginatedMeta = {
  total: number;
  page: number;
  limit: number;
};

const VALID_CASE_TYPES = new Set<string>(Object.values(ModerationCaseType));
const VALID_CASE_STATUSES = new Set<string>(Object.values(ModerationCaseStatus));
const VALID_TARGET_TYPES = new Set(["business_profile", "review", "user"]);

function validateCaseType(type: unknown): ModerationCaseType {
  if (typeof type !== "string" || !VALID_CASE_TYPES.has(type)) {
    throw new Error("INVALID_MODERATION_CASE_TYPE");
  }
  return type as ModerationCaseType;
}

function validateTargetType(targetType: unknown): string {
  if (typeof targetType !== "string" || !VALID_TARGET_TYPES.has(targetType)) {
    throw new Error("INVALID_TARGET_TYPE");
  }
  return targetType;
}

function validateDescription(description: unknown): string {
  if (typeof description !== "string" || description.length < 10 || description.length > 1000) {
    throw new Error("INVALID_DESCRIPTION");
  }
  return description.trim();
}

function parsePagination(page: unknown, limit: unknown) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  return { page: p, limit: l, skip: (p - 1) * l };
}

function mapCase(c: {
  id: string;
  type: ModerationCaseType;
  status: ModerationCaseStatus;
  reporterUserId: string | null;
  targetType: string;
  targetId: string;
  description: string;
  internalNote: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  decisions: Array<{
    id: string;
    adminUserId: string;
    decision: string;
    note: string | null;
    createdAt: Date;
  }>;
}): ModerationCaseView {
  return {
    id: c.id,
    type: c.type,
    status: c.status,
    reporterUserId: c.reporterUserId,
    targetType: c.targetType,
    targetId: c.targetId,
    description: c.description,
    internalNote: c.internalNote,
    resolvedAt: c.resolvedAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    decisions: c.decisions.map((d) => ({
      id: d.id,
      adminUserId: d.adminUserId,
      decision: d.decision,
      note: d.note,
      createdAt: d.createdAt.toISOString()
    }))
  };
}

// ------------------------------------------------------------------
// Reports / Moderation Cases
// ------------------------------------------------------------------

export async function createModerationCase(input: {
  reporterUserId: string;
  type: unknown;
  targetType: unknown;
  targetId: string;
  description: unknown;
}): Promise<ModerationCaseView> {
  const type = validateCaseType(input.type);
  const targetType = validateTargetType(input.targetType);
  const description = validateDescription(input.description);

  if (typeof input.targetId !== "string" || input.targetId.length < 1) {
    throw new Error("INVALID_TARGET_ID");
  }

  const created = await prisma.moderationCase.create({
    data: {
      type,
      targetType,
      targetId: input.targetId,
      description,
      reporterUserId: input.reporterUserId
    },
    include: { decisions: true }
  });

  await prisma.auditLog.create({
    data: {
      action: "moderation.case.created",
      actorUserId: input.reporterUserId,
      entityType: "moderation_cases",
      entityId: created.id,
      metadata: { type, targetType, targetId: input.targetId }
    }
  });

  return mapCase(created);
}

export async function listModerationCases(input: {
  status?: unknown;
  page?: unknown;
  limit?: unknown;
}): Promise<{ data: ModerationCaseView[]; meta: PaginatedMeta }> {
  const { page, limit, skip } = parsePagination(input.page, input.limit);

  const where =
    typeof input.status === "string" && VALID_CASE_STATUSES.has(input.status)
      ? { status: input.status as ModerationCaseStatus }
      : {};

  const [cases, total] = await prisma.$transaction([
    prisma.moderationCase.findMany({
      where,
      include: { decisions: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    }),
    prisma.moderationCase.count({ where })
  ]);

  return { data: cases.map(mapCase), meta: { total, page, limit } };
}

export async function resolveModerationCase(input: {
  caseId: string;
  adminUserId: string;
  decision: "resolved" | "dismissed";
  note?: string;
}): Promise<ModerationCaseView> {
  const existing = await prisma.moderationCase.findUnique({
    where: { id: input.caseId },
    include: { decisions: true }
  });

  if (!existing) {
    throw new Error("MODERATION_CASE_NOT_FOUND");
  }

  if (existing.status === ModerationCaseStatus.RESOLVED || existing.status === ModerationCaseStatus.DISMISSED) {
    throw new Error("MODERATION_CASE_ALREADY_CLOSED");
  }

  if (input.decision !== "resolved" && input.decision !== "dismissed") {
    throw new Error("INVALID_MODERATION_DECISION");
  }

  const newStatus =
    input.decision === "resolved" ? ModerationCaseStatus.RESOLVED : ModerationCaseStatus.DISMISSED;

  const [updated] = await prisma.$transaction([
    prisma.moderationCase.update({
      where: { id: input.caseId },
      data: {
        status: newStatus,
        resolvedAt: new Date(),
        decisions: {
          create: {
            adminUserId: input.adminUserId,
            decision: input.decision,
            note: input.note ?? null
          }
        }
      },
      include: { decisions: true }
    }),
    prisma.auditLog.create({
      data: {
        action: `moderation.case.${input.decision}`,
        actorUserId: input.adminUserId,
        entityType: "moderation_cases",
        entityId: input.caseId,
        metadata: { decision: input.decision, note: input.note ?? null }
      }
    })
  ]);

  return mapCase(updated);
}

// ------------------------------------------------------------------
// Admin: list pending verifications
// ------------------------------------------------------------------

export async function listAdminVerifications(input: {
  status?: unknown;
  page?: unknown;
  limit?: unknown;
}): Promise<{ data: VerificationRequestSummary[]; meta: PaginatedMeta }> {
  const { page, limit, skip } = parsePagination(input.page, input.limit);

  const VALID_STATUSES = new Set<string>(Object.values(VerificationStatus));

  const where =
    typeof input.status === "string" && VALID_STATUSES.has(input.status)
      ? { status: input.status as VerificationStatus }
      : {
          status: {
            in: [VerificationStatus.PENDING_REVIEW, VerificationStatus.MORE_INFO_REQUIRED] as VerificationStatus[]
          }
        };

  const [requests, total] = await prisma.$transaction([
    prisma.verificationRequest.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit
    }),
    prisma.verificationRequest.count({ where })
  ]);

  return {
    data: requests.map((r) => ({
      id: r.id,
      userId: r.userId,
      status: r.status,
      notes: r.notes,
      submittedAt: r.createdAt.toISOString(),
      reviewedAt: r.reviewedAt?.toISOString() ?? null,
      reviewedByUserId: r.reviewedBy ?? null,
      userName: r.user.displayName,
      userEmail: r.user.email
    })),
    meta: { total, page, limit }
  };
}

// ------------------------------------------------------------------
// Admin: get business details
// ------------------------------------------------------------------

export async function getAdminBusinessView(businessProfileId: string): Promise<AdminBusinessView> {
  const profile = await prisma.businessProfile.findUnique({
    where: { id: businessProfileId },
    include: {
      user: true,
      trustScore: {
        include: {
          badgeLevel: true
        }
      },
      reviews: {
        where: { status: "PENDING" },
        select: { id: true }
      }
    }
  });

  if (!profile) {
    throw new Error("BUSINESS_PROFILE_NOT_FOUND");
  }

  return {
    id: profile.id,
    slug: profile.slug,
    businessName: profile.businessName,
    headline: profile.headline,
    description: profile.description,
    publicEmail: profile.publicEmail,
    publicPhone: profile.publicPhone,
    city: profile.city,
    state: profile.state,
    isPublished: profile.isPublished,
    createdAt: profile.createdAt.toISOString(),
    user: {
      id: profile.user.id,
      email: profile.user.email,
      fullName: profile.user.fullName,
      verificationStatus: profile.user.verificationStatus,
      cnpj: profile.user.cnpj
    },
    trustScore: profile.trustScore
      ? {
          score: profile.trustScore.score,
          badgeLevel: profile.trustScore.badgeLevel?.code ?? null,
          isSuspended: profile.trustScore.isSuspended
        }
      : null,
    pendingReviewsCount: profile.reviews.length
  };
}

// ------------------------------------------------------------------
// Admin: paginated audit log
// ------------------------------------------------------------------

export async function listAdminAuditLog(input: {
  page?: unknown;
  limit?: unknown;
}): Promise<{ data: Array<{ id: string; action: string; actor: string; createdAt: string; entityType: string | null; entityId: string | null }>; meta: PaginatedMeta }> {
  const { page, limit, skip } = parsePagination(input.page, input.limit);

  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    }),
    prisma.auditLog.count()
  ]);

  return {
    data: logs.map((log) => ({
      id: log.id,
      action: log.action,
      actor: log.actor?.displayName ?? "system",
      createdAt: log.createdAt.toISOString(),
      entityType: log.entityType,
      entityId: log.entityId
    })),
    meta: { total, page, limit }
  };
}
