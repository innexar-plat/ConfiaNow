import { BadgeEventType, BadgeLevelCode, ReviewStatus, UserRole, VerificationStatus } from "@prisma/client";
import { prisma } from "@platform/database";
import {
  computeTrustLeadResponseScore,
  computeTrustReputationScore,
  resolveTrustBadgeLevel
} from "./scoring";

const DEFAULT_BADGE_LEVELS = [
  { code: BadgeLevelCode.NONE, label: "Sem selo", minScore: 0, description: "Negocio sem classificacao publica de confianca.", displayOrder: 0 },
  { code: BadgeLevelCode.BRONZE, label: "Bronze", minScore: 45, description: "Negocio com base inicial de confianca publicada.", displayOrder: 1 },
  { code: BadgeLevelCode.SILVER, label: "Prata", minScore: 70, description: "Negocio com boa completude e operacao consistente.", displayOrder: 2 },
  { code: BadgeLevelCode.GOLD, label: "Ouro", minScore: 90, description: "Negocio com alta completude e excelente responsividade inicial.", displayOrder: 3 }
];

type TrustScoreRecord = {
  businessProfileId: string;
  score: number;
  isSuspended: boolean;
  suspensionReason: string | null;
  verificationPoints: number;
  profilePoints: number;
  servicePoints: number;
  portfolioPoints: number;
  leadResponsePoints: number;
  reputationPoints: number;
  penaltyPoints: number;
  totalLeadCount: number;
  respondedLeadCount: number;
  responseRate: number | null;
  approvedReviewCount: number;
  averageRating: number | null;
  lastCalculatedAt: Date | null;
  badgeLevel: { code: BadgeLevelCode; label: string } | null;
};

export type BadgeLevelView = {
  code: string;
  label: string;
  minScore: number;
  description: string | null;
  displayOrder: number;
};

export type PublicTrustScoreView = {
  businessProfileId: string;
  score: number;
  badgeCode: string;
  badgeLabel: string;
  isSuspended: boolean;
  suspensionReason: string | null;
  responseRate: number | null;
  totalLeadCount: number;
  respondedLeadCount: number;
  approvedReviewCount: number;
  averageRating: number | null;
  lastCalculatedAt: string | null;
};

export type BusinessBadgeStatusView = PublicTrustScoreView & {
  businessName: string;
  businessSlug: string;
  pendingItems: string[];
  componentBreakdown: {
    verification: number;
    profile: number;
    services: number;
    portfolio: number;
    leadResponse: number;
    reputation: number;
    penalties: number;
  };
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toCodeValue(code: BadgeLevelCode) {
  return code.toLowerCase();
}

function mapBadgeLevel(level: { code: BadgeLevelCode; label: string; minScore: number; description: string | null; displayOrder: number }): BadgeLevelView {
  return {
    code: toCodeValue(level.code),
    label: level.label,
    minScore: level.minScore,
    description: level.description,
    displayOrder: level.displayOrder
  };
}

function mapPublicTrustScore(record: TrustScoreRecord): PublicTrustScoreView {
  return {
    businessProfileId: record.businessProfileId,
    score: record.score,
    badgeCode: toCodeValue(record.badgeLevel?.code ?? BadgeLevelCode.NONE),
    badgeLabel: record.badgeLevel?.label ?? "Sem selo",
    isSuspended: record.isSuspended,
    suspensionReason: record.suspensionReason,
    responseRate: record.responseRate,
    totalLeadCount: record.totalLeadCount,
    respondedLeadCount: record.respondedLeadCount,
    approvedReviewCount: record.approvedReviewCount,
    averageRating: record.averageRating,
    lastCalculatedAt: record.lastCalculatedAt?.toISOString() ?? null
  };
}

async function ensureBadgeLevelsSeedData() {
  await Promise.all(DEFAULT_BADGE_LEVELS.map((level) => prisma.badgeLevel.upsert({
    where: { code: level.code },
    update: {
      label: level.label,
      minScore: level.minScore,
      description: level.description,
      displayOrder: level.displayOrder,
      isActive: true
    },
    create: {
      code: level.code,
      label: level.label,
      minScore: level.minScore,
      description: level.description,
      displayOrder: level.displayOrder,
      isActive: true
    }
  })));
}

async function getBadgeLevelsByCode() {
  await ensureBadgeLevelsSeedData();
  const levels = await prisma.badgeLevel.findMany({ where: { isActive: true } });
  return new Map(levels.map((level) => [level.code, level]));
}

function getVerificationPoints(status: VerificationStatus) {
  if (status === VerificationStatus.APPROVED) {
    return 35;
  }

  if (status === VerificationStatus.PENDING_REVIEW) {
    return 18;
  }

  return 0;
}

function getProfilePoints(profile: {
  headline: string | null;
  description: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
  whatsapp: string | null;
  websiteUrl: string | null;
  city: string | null;
  state: string | null;
  serviceArea: string | null;
  yearsInBusiness: number | null;
}) {
  let score = 0;

  if (profile.headline) score += 4;
  if (profile.description) score += 5;
  if (profile.publicEmail) score += 2;
  if (profile.publicPhone) score += 2;
  if (profile.whatsapp) score += 2;
  if (profile.websiteUrl) score += 2;
  if (profile.city && profile.state) score += 3;
  if (profile.serviceArea) score += 2;
  if ((profile.yearsInBusiness ?? 0) > 0) score += 3;

  return clamp(score, 0, 25);
}

export {
  computeTrustLeadResponseScore,
  computeTrustReputationScore,
  resolveTrustBadgeLevel
} from "./scoring";

function getLeadResponseMetrics(leads: Array<{ createdAt: Date; respondedAt: Date | null }>) {
  const totalLeadCount = leads.length;
  const respondedLeadCount = leads.filter((lead) => lead.respondedAt).length;
  const respondedInTimeCount = leads.filter((lead) => lead.respondedAt && lead.respondedAt.getTime() - lead.createdAt.getTime() <= 24 * 60 * 60 * 1000).length;
  const overdueOpenCount = leads.filter((lead) => !lead.respondedAt && Date.now() - lead.createdAt.getTime() > 24 * 60 * 60 * 1000).length;

  if (totalLeadCount === 0) {
    return {
      totalLeadCount,
      respondedLeadCount,
      responseRate: null,
      points: computeTrustLeadResponseScore({ totalLeadCount, respondedInTimeCount: 0, overdueOpenCount: 0 })
    };
  }

  const responseRate = respondedInTimeCount / totalLeadCount;
  const points = computeTrustLeadResponseScore({ totalLeadCount, respondedInTimeCount, overdueOpenCount });

  return {
    totalLeadCount,
    respondedLeadCount,
    responseRate,
    points
  };
}

function getPendingItems(input: {
  isPublished: boolean;
  verificationStatus: VerificationStatus;
  headline: string | null;
  description: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
  city: string | null;
  state: string | null;
  servicesCount: number;
  portfolioCount: number;
}) {
  const items: string[] = [];

  if (!input.isPublished) items.push("Publicar o perfil no catalogo publico");
  if (input.verificationStatus !== VerificationStatus.APPROVED) items.push("Concluir a verificacao completa do negocio");
  if (!input.headline) items.push("Adicionar uma headline comercial objetiva");
  if (!input.description) items.push("Adicionar uma descricao publica do negocio");
  if (!input.publicEmail || !input.publicPhone) items.push("Preencher e-mail e telefone publicos");
  if (!input.city || !input.state) items.push("Informar cidade e estado de atendimento");
  if (input.servicesCount === 0) items.push("Cadastrar ao menos um servico publico");
  if (input.portfolioCount === 0) items.push("Adicionar ao menos um item de portfolio");

  return items;
}

async function syncTrustSnapshotIntoSearchIndex(businessProfileId: string, score: number, badgeCode: BadgeLevelCode) {
  await prisma.businessSearchIndex.updateMany({
    where: { businessProfileId },
    data: {
      trustScore: score,
      trustBadge: badgeCode
    }
  });
}

async function getOrCreateTrustRecord(businessProfileId: string) {
  const existing = await prisma.trustScore.findUnique({
    where: { businessProfileId },
    include: { badgeLevel: true }
  });

  if (existing) {
    return existing;
  }

  const levelsByCode = await getBadgeLevelsByCode();
  return prisma.trustScore.create({
    data: {
      businessProfileId,
      badgeLevelId: levelsByCode.get(BadgeLevelCode.NONE)?.id,
      score: 0,
      lastCalculatedAt: new Date()
    },
    include: { badgeLevel: true }
  });
}

async function computeAndPersistTrustScore(
  businessProfileId: string,
  options?: { actorUserId?: string; reason?: string; eventType?: BadgeEventType; recordEvent?: boolean }
) {
  const profile = await prisma.businessProfile.findUnique({
    where: { id: businessProfileId },
    include: {
      user: { select: { verificationStatus: true, role: true } },
      services: { select: { id: true } },
      portfolioItems: { select: { id: true } },
      receivedLeads: { select: { createdAt: true, respondedAt: true } },
      reviews: {
        where: { status: ReviewStatus.APPROVED },
        select: { rating: true }
      },
      badgePenalties: { where: { isActive: true }, select: { points: true } }
    }
  });

  if (!profile) {
    throw new Error("BUSINESS_PROFILE_NOT_FOUND");
  }

  if (profile.user.role !== UserRole.BUSINESS) {
    throw new Error("BUSINESS_ROLE_REQUIRED");
  }

  const previous = await getOrCreateTrustRecord(businessProfileId);
  const levelsByCode = await getBadgeLevelsByCode();
  const verificationPoints = getVerificationPoints(profile.user.verificationStatus);
  const profilePoints = getProfilePoints(profile);
  const servicePoints = clamp(profile.services.length * 5, 0, 15);
  const portfolioPoints = clamp(profile.portfolioItems.length * 5, 0, 15);
  const leadMetrics = getLeadResponseMetrics(profile.receivedLeads);
  const approvedReviewCount = profile.reviews.length;
  const averageRating = approvedReviewCount > 0
    ? profile.reviews.reduce((total, review) => total + review.rating, 0) / approvedReviewCount
    : null;
  const reputationPoints = computeTrustReputationScore({ approvedReviewCount, averageRating });
  const penaltyPoints = profile.badgePenalties.reduce((total: number, penalty: { points: number }) => total + penalty.points, 0);
  const rawScore = verificationPoints + profilePoints + servicePoints + portfolioPoints + leadMetrics.points + reputationPoints - penaltyPoints;
  const nextScore = profile.isPublished ? clamp(rawScore, 0, 100) : 0;
  const nextBadgeCode = resolveTrustBadgeLevel(nextScore, previous.isSuspended);
  const nextBadgeLevel = levelsByCode.get(nextBadgeCode) ?? levelsByCode.get(BadgeLevelCode.NONE) ?? null;

  const updated = await prisma.trustScore.update({
    where: { businessProfileId },
    data: {
      badgeLevelId: nextBadgeLevel?.id ?? null,
      score: nextScore,
      verificationPoints,
      profilePoints,
      servicePoints,
      portfolioPoints,
      leadResponsePoints: leadMetrics.points,
      reputationPoints,
      penaltyPoints,
      totalLeadCount: leadMetrics.totalLeadCount,
      respondedLeadCount: leadMetrics.respondedLeadCount,
      responseRate: leadMetrics.responseRate,
      approvedReviewCount,
      averageRating,
      lastCalculatedAt: new Date()
    },
    include: { badgeLevel: true }
  });

  await syncTrustSnapshotIntoSearchIndex(businessProfileId, updated.score, updated.badgeLevel?.code ?? BadgeLevelCode.NONE);

  if (options?.recordEvent !== false) {
    const previousBadgeCode = previous.badgeLevel?.code ?? BadgeLevelCode.NONE;
    const eventType = options?.eventType
      ?? (previousBadgeCode === nextBadgeCode
        ? BadgeEventType.RECALCULATED
        : previousBadgeCode === BadgeLevelCode.NONE || previous.score < updated.score
          ? BadgeEventType.PROMOTED
          : BadgeEventType.DEMOTED);

    await prisma.badgeEvent.create({
      data: {
        businessProfileId,
        actorUserId: options?.actorUserId,
        type: eventType,
        previousBadgeLevel: previousBadgeCode,
        nextBadgeLevel: updated.badgeLevel?.code ?? BadgeLevelCode.NONE,
        scoreBefore: previous.score,
        scoreAfter: updated.score,
        reason: options?.reason
      }
    });
  }

  return updated;
}

export async function listBadgeLevels() {
  await ensureBadgeLevelsSeedData();
  const levels = await prisma.badgeLevel.findMany({
    where: { isActive: true, code: { not: BadgeLevelCode.NONE } },
    orderBy: { displayOrder: "asc" }
  });

  return levels.map(mapBadgeLevel);
}

export async function recalculateBusinessTrustScore(businessProfileId: string, actorUserId?: string, reason?: string) {
  const updated = await computeAndPersistTrustScore(businessProfileId, { actorUserId, reason, recordEvent: true });
  return mapPublicTrustScore(updated);
}

export async function getPublicBusinessTrustScore(businessProfileId: string) {
  let record = await prisma.trustScore.findUnique({
    where: { businessProfileId },
    include: { badgeLevel: true }
  });

  if (!record) {
    record = await computeAndPersistTrustScore(businessProfileId, { recordEvent: false });
  }

  return mapPublicTrustScore(record);
}

export async function getBusinessBadgeStatus(userId: string): Promise<BusinessBadgeStatusView> {
  const profile = await prisma.businessProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { role: true, verificationStatus: true } },
      services: { select: { id: true } },
      portfolioItems: { select: { id: true } },
      trustScore: { include: { badgeLevel: true } }
    }
  });

  if (!profile) {
    throw new Error("BUSINESS_PROFILE_NOT_FOUND");
  }

  if (profile.user.role !== UserRole.BUSINESS) {
    throw new Error("BUSINESS_ROLE_REQUIRED");
  }

  const trustRecord = profile.trustScore ?? await computeAndPersistTrustScore(profile.id, { recordEvent: false });
  const publicView = mapPublicTrustScore(trustRecord);

  return {
    ...publicView,
    businessName: profile.businessName,
    businessSlug: profile.slug,
    pendingItems: getPendingItems({
      isPublished: profile.isPublished,
      verificationStatus: profile.user.verificationStatus,
      headline: profile.headline,
      description: profile.description,
      publicEmail: profile.publicEmail,
      publicPhone: profile.publicPhone,
      city: profile.city,
      state: profile.state,
      servicesCount: profile.services.length,
      portfolioCount: profile.portfolioItems.length
    }),
    componentBreakdown: {
      verification: trustRecord.verificationPoints,
      profile: trustRecord.profilePoints,
      services: trustRecord.servicePoints,
      portfolio: trustRecord.portfolioPoints,
      leadResponse: trustRecord.leadResponsePoints,
      reputation: trustRecord.reputationPoints,
      penalties: trustRecord.penaltyPoints
    }
  };
}

export async function suspendBusinessBadge(businessProfileId: string, actorUserId?: string, reason?: string) {
  const existing = await getOrCreateTrustRecord(businessProfileId);
  const levelsByCode = await getBadgeLevelsByCode();
  const suspended = await prisma.trustScore.update({
    where: { businessProfileId },
    data: {
      isSuspended: true,
      suspensionReason: reason ?? "Badge suspended by administrator",
      badgeLevelId: levelsByCode.get(BadgeLevelCode.NONE)?.id ?? null,
      lastCalculatedAt: new Date()
    },
    include: { badgeLevel: true }
  });

  await syncTrustSnapshotIntoSearchIndex(businessProfileId, suspended.score, BadgeLevelCode.NONE);
  await prisma.badgeEvent.create({
    data: {
      businessProfileId,
      actorUserId,
      type: BadgeEventType.SUSPENDED,
      previousBadgeLevel: existing.badgeLevel?.code ?? BadgeLevelCode.NONE,
      nextBadgeLevel: BadgeLevelCode.NONE,
      scoreBefore: existing.score,
      scoreAfter: suspended.score,
      reason: reason ?? "Badge suspended by administrator"
    }
  });

  return mapPublicTrustScore(suspended);
}

export async function restoreBusinessBadge(businessProfileId: string, actorUserId?: string, reason?: string) {
  await getOrCreateTrustRecord(businessProfileId);
  await prisma.trustScore.update({
    where: { businessProfileId },
    data: {
      isSuspended: false,
      suspensionReason: null
    }
  });

  const restored = await computeAndPersistTrustScore(businessProfileId, {
    actorUserId,
    reason: reason ?? "Badge restored by administrator",
    eventType: BadgeEventType.RESTORED,
    recordEvent: true
  });

  return mapPublicTrustScore(restored);
}