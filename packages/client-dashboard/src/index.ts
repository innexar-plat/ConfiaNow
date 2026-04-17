import "dotenv/config";
import { LeadStatus, ModerationCaseStatus, ReviewStatus, UserRole } from "@prisma/client";
import { prisma } from "@platform/database";

export type ClientDashboardOverview = {
  clientUserId: string;
  favoritesCount: number;
  historyCount: number;
  pendingReviewsCount: number;
  openReportsCount: number;
  lastActivityAt: string | null;
};

export type ClientDashboardFavoriteView = {
  businessProfileId: string;
  businessName: string;
  slug: string;
  headline: string | null;
  city: string | null;
  state: string | null;
  createdAt: string;
  trust: {
    score: number;
    badgeCode: string | null;
    badgeLabel: string | null;
  } | null;
};

export type ClientDashboardHistoryItem = {
  leadId: string;
  businessProfileId: string;
  businessName: string;
  businessSlug: string;
  subject: string;
  status: string;
  createdAt: string;
  respondedAt: string | null;
  contactReleasedAt: string | null;
  isLate: boolean;
  canRecontact: boolean;
  reviewStatus: string | null;
  isFavorited: boolean;
};

export type ClientPendingReviewItem = {
  leadId: string;
  businessProfileId: string;
  businessName: string;
  businessSlug: string;
  subject: string;
  contactReleasedAt: string;
  canReview: boolean;
  reason: string | null;
  existingReviewStatus: string | null;
  isFavorited: boolean;
};

export type ClientReportTimelineItem = {
  id: string;
  type: string;
  status: string;
  targetId: string;
  targetType: string;
  description: string;
  createdAt: string;
  resolvedAt: string | null;
};

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function mapLeadStatus(status: LeadStatus) {
  return status.toLowerCase();
}

function mapReviewStatus(status: ReviewStatus | null | undefined) {
  return status ? status.toLowerCase() : null;
}

function isLeadLate(lead: { status: LeadStatus; createdAt: Date; respondedAt: Date | null }) {
  if (lead.status === LeadStatus.OPEN && !lead.respondedAt) {
    return Date.now() - lead.createdAt.getTime() > 1000 * 60 * 60 * 48;
  }

  return false;
}

export function computeClientPendingReviewReason(input: {
  contactReleasedAt: Date | null;
  existingReviewStatus: ReviewStatus | null;
}) {
  if (!input.contactReleasedAt) {
    return { canReview: false, reason: "LEAD_NOT_ELIGIBLE_FOR_REVIEW" };
  }

  if (input.existingReviewStatus && input.existingReviewStatus !== ReviewStatus.MORE_INFO_REQUIRED) {
    return { canReview: false, reason: "REVIEW_ALREADY_EXISTS" };
  }

  return { canReview: true, reason: null };
}

async function requireClient(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || user.role !== UserRole.CLIENT) {
    throw new Error("CLIENT_ROLE_REQUIRED");
  }

  return user;
}

async function syncClientDashboardView(userId: string) {
  await requireClient(userId);

  const [favoritesCount, historyCount, openReportsCount, pendingReviewRows, latestLead] = await Promise.all([
    prisma.clientFavorite.count({ where: { clientUserId: userId } }),
    prisma.lead.count({ where: { clientUserId: userId } }),
    prisma.moderationCase.count({
      where: {
        reporterUserId: userId,
        status: { in: [ModerationCaseStatus.OPEN, ModerationCaseStatus.UNDER_REVIEW] }
      }
    }),
    prisma.lead.findMany({
      where: { clientUserId: userId },
      select: {
        id: true,
        contactReleasedAt: true,
        review: { select: { status: true } }
      }
    }),
    prisma.lead.findFirst({
      where: { clientUserId: userId },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true }
    })
  ]);

  const pendingReviewsCount = pendingReviewRows.filter((lead) => computeClientPendingReviewReason({
    contactReleasedAt: lead.contactReleasedAt,
    existingReviewStatus: lead.review?.status ?? null
  }).canReview).length;

  const snapshotDate = startOfUtcDay();

  await prisma.clientDashboardView.upsert({
    where: {
      clientUserId_snapshotDate: {
        clientUserId: userId,
        snapshotDate
      }
    },
    update: {
      favoritesCount,
      historyCount,
      pendingReviewsCount,
      openReportsCount
    },
    create: {
      clientUserId: userId,
      snapshotDate,
      favoritesCount,
      historyCount,
      pendingReviewsCount,
      openReportsCount
    }
  });

  return {
    clientUserId: userId,
    favoritesCount,
    historyCount,
    pendingReviewsCount,
    openReportsCount,
    lastActivityAt: latestLead?.updatedAt.toISOString() ?? null
  } satisfies ClientDashboardOverview;
}

export async function getClientDashboardOverview(userId: string): Promise<ClientDashboardOverview> {
  return syncClientDashboardView(userId);
}

export async function listClientDashboardFavorites(userId: string): Promise<ClientDashboardFavoriteView[]> {
  await requireClient(userId);

  const favorites = await prisma.clientFavorite.findMany({
    where: { clientUserId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      businessProfile: {
        include: {
          trustScore: { include: { badgeLevel: true } }
        }
      }
    }
  });

  return favorites.map((favorite) => ({
    businessProfileId: favorite.businessProfileId,
    businessName: favorite.businessProfile.businessName,
    slug: favorite.businessProfile.slug,
    headline: favorite.businessProfile.headline,
    city: favorite.businessProfile.city,
    state: favorite.businessProfile.state,
    createdAt: favorite.createdAt.toISOString(),
    trust: favorite.businessProfile.trustScore ? {
      score: favorite.businessProfile.trustScore.score,
      badgeCode: favorite.businessProfile.trustScore.badgeLevel?.code.toLowerCase() ?? null,
      badgeLabel: favorite.businessProfile.trustScore.badgeLevel?.label ?? null
    } : null
  }));
}

export async function addClientFavorite(userId: string, businessProfileId: string) {
  await requireClient(userId);

  const businessProfile = await prisma.businessProfile.findFirst({
    where: { id: businessProfileId, isPublished: true },
    select: { id: true }
  });

  if (!businessProfile) {
    throw new Error("BUSINESS_PROFILE_NOT_FOUND");
  }

  await prisma.clientFavorite.upsert({
    where: {
      clientUserId_businessProfileId: {
        clientUserId: userId,
        businessProfileId
      }
    },
    update: {},
    create: {
      clientUserId: userId,
      businessProfileId
    }
  });

  return {
    businessProfileId,
    favorited: true
  };
}

export async function removeClientFavorite(userId: string, businessProfileId: string) {
  await requireClient(userId);

  await prisma.clientFavorite.deleteMany({
    where: {
      clientUserId: userId,
      businessProfileId
    }
  });

  return {
    businessProfileId,
    favorited: false
  };
}

export async function listClientDashboardHistory(userId: string): Promise<ClientDashboardHistoryItem[]> {
  await requireClient(userId);

  const [leads, favorites] = await Promise.all([
    prisma.lead.findMany({
      where: { clientUserId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        businessProfile: {
          select: {
            id: true,
            businessName: true,
            slug: true
          }
        },
        review: {
          select: { status: true }
        }
      }
    }),
    prisma.clientFavorite.findMany({
      where: { clientUserId: userId },
      select: { businessProfileId: true }
    })
  ]);

  const favoriteIds = new Set(favorites.map((item) => item.businessProfileId));

  return leads.map((lead) => ({
    leadId: lead.id,
    businessProfileId: lead.businessProfileId,
    businessName: lead.businessProfile.businessName,
    businessSlug: lead.businessProfile.slug,
    subject: lead.subject,
    status: mapLeadStatus(lead.status),
    createdAt: lead.createdAt.toISOString(),
    respondedAt: lead.respondedAt?.toISOString() ?? null,
    contactReleasedAt: lead.contactReleasedAt?.toISOString() ?? null,
    isLate: isLeadLate(lead),
    canRecontact: Boolean(lead.contactReleasedAt),
    reviewStatus: mapReviewStatus(lead.review?.status),
    isFavorited: favoriteIds.has(lead.businessProfileId)
  }));
}

export async function listClientPendingReviews(userId: string): Promise<ClientPendingReviewItem[]> {
  await requireClient(userId);

  const [leads, favorites] = await Promise.all([
    prisma.lead.findMany({
      where: { clientUserId: userId },
      orderBy: { contactReleasedAt: "desc" },
      include: {
        businessProfile: {
          select: {
            id: true,
            businessName: true,
            slug: true
          }
        },
        review: {
          select: { status: true }
        }
      }
    }),
    prisma.clientFavorite.findMany({
      where: { clientUserId: userId },
      select: { businessProfileId: true }
    })
  ]);

  const favoriteIds = new Set(favorites.map((item) => item.businessProfileId));

  return leads.flatMap((lead) => {
    const eligibility = computeClientPendingReviewReason({
      contactReleasedAt: lead.contactReleasedAt,
      existingReviewStatus: lead.review?.status ?? null
    });

    if (!eligibility.canReview || !lead.contactReleasedAt) {
      return [];
    }

    return [{
      leadId: lead.id,
      businessProfileId: lead.businessProfileId,
      businessName: lead.businessProfile.businessName,
      businessSlug: lead.businessProfile.slug,
      subject: lead.subject,
      contactReleasedAt: lead.contactReleasedAt.toISOString(),
      canReview: true,
      reason: eligibility.reason,
      existingReviewStatus: mapReviewStatus(lead.review?.status),
      isFavorited: favoriteIds.has(lead.businessProfileId)
    } satisfies ClientPendingReviewItem];
  });
}

export async function listClientReportTimeline(userId: string): Promise<ClientReportTimelineItem[]> {
  await requireClient(userId);

  const cases = await prisma.moderationCase.findMany({
    where: { reporterUserId: userId },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  return cases.map((item) => ({
    id: item.id,
    type: item.type.toLowerCase(),
    status: item.status.toLowerCase(),
    targetId: item.targetId,
    targetType: item.targetType,
    description: item.description,
    createdAt: item.createdAt.toISOString(),
    resolvedAt: item.resolvedAt?.toISOString() ?? null
  }));
}
