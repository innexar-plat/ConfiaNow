import { AnalyticsEventType, ReviewStatus, UserRole } from "@prisma/client";
import { recordAnalyticsEvent } from "@platform/analytics";
import { prisma } from "@platform/database";
import { recalculateBusinessTrustScore } from "@platform/trust";
import { evaluateLeadReviewEligibility } from "./rules";

export type LeadReviewEligibilityView = {
  leadId: string;
  businessProfileId: string;
  businessName: string;
  canReview: boolean;
  reason: string | null;
  existingReviewId: string | null;
  existingReviewStatus: string | null;
};

export type PublicBusinessReviewView = {
  id: string;
  leadId: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  publishedAt: string | null;
  clientDisplayName: string;
  evidence: Array<{ id: string; note: string; reference: string | null; createdAt: string }>;
};

export type BusinessReviewSummaryView = {
  approvedCount: number;
  averageRating: number | null;
  latestPublishedAt: string | null;
};

export type BusinessPublicReviewsView = {
  summary: BusinessReviewSummaryView;
  items: PublicBusinessReviewView[];
};

export type PendingReviewModerationView = {
  id: string;
  leadId: string;
  businessProfileId: string;
  businessName: string;
  clientDisplayName: string;
  rating: number;
  title: string;
  comment: string;
  status: string;
  createdAt: string;
  evidenceCount: number;
  lastEvidenceNote: string | null;
};

function mapReviewStatus(status: ReviewStatus) {
  return status.toLowerCase();
}

export { evaluateLeadReviewEligibility } from "./rules";

async function requireClient(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("CLIENT_NOT_FOUND");
  if (user.role !== UserRole.CLIENT) throw new Error("CLIENT_ROLE_REQUIRED");
  return user;
}

async function requireAdmin(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("ADMIN_NOT_FOUND");
  if (user.role !== UserRole.ADMIN) throw new Error("ADMIN_ROLE_REQUIRED");
  return user;
}

function mapEvidence(evidence: { id: string; note: string; reference: string | null; createdAt: Date }) {
  return {
    id: evidence.id,
    note: evidence.note,
    reference: evidence.reference,
    createdAt: evidence.createdAt.toISOString()
  };
}

function mapPublicReview(review: {
  id: string;
  leadId: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: Date;
  publishedAt: Date | null;
  client: { displayName: string };
  evidence: Array<{ id: string; note: string; reference: string | null; createdAt: Date }>;
}): PublicBusinessReviewView {
  return {
    id: review.id,
    leadId: review.leadId,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    publishedAt: review.publishedAt?.toISOString() ?? null,
    clientDisplayName: review.client.displayName,
    evidence: review.evidence.map(mapEvidence)
  };
}

function mapSummary(input: { approvedCount: number; averageRating: number | null; latestPublishedAt: Date | null }): BusinessReviewSummaryView {
  return {
    approvedCount: input.approvedCount,
    averageRating: input.averageRating,
    latestPublishedAt: input.latestPublishedAt?.toISOString() ?? null
  };
}

export async function getLeadReviewEligibility(clientUserId: string, leadId: string): Promise<LeadReviewEligibilityView> {
  await requireClient(clientUserId);
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      businessProfile: { select: { id: true, businessName: true } },
      review: { select: { id: true, status: true } }
    }
  });

  if (!lead) throw new Error("LEAD_NOT_FOUND");

  const eligibility = evaluateLeadReviewEligibility({
    leadClientUserId: lead.clientUserId,
    actorUserId: clientUserId,
    contactReleasedAt: lead.contactReleasedAt,
    existingReviewStatus: lead.review?.status ?? null
  });

  return {
    leadId: lead.id,
    businessProfileId: lead.businessProfile.id,
    businessName: lead.businessProfile.businessName,
    canReview: eligibility.canReview,
    reason: eligibility.reason,
    existingReviewId: lead.review?.id ?? null,
    existingReviewStatus: lead.review ? mapReviewStatus(lead.review.status) : null
  };
}

export async function createReview(input: {
  clientUserId: string;
  leadId: string;
  rating: number;
  title: string;
  comment: string;
  evidenceNote?: string;
  evidenceReference?: string;
}) {
  await requireClient(input.clientUserId);
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new Error("INVALID_REVIEW_RATING");
  }

  const lead = await prisma.lead.findUnique({
    where: { id: input.leadId },
    include: {
      businessProfile: { select: { id: true } },
      review: { select: { id: true, status: true } }
    }
  });

  if (!lead) throw new Error("LEAD_NOT_FOUND");

  const eligibility = evaluateLeadReviewEligibility({
    leadClientUserId: lead.clientUserId,
    actorUserId: input.clientUserId,
    contactReleasedAt: lead.contactReleasedAt,
    existingReviewStatus: lead.review?.status ?? null
  });

  if (!eligibility.canReview) {
    throw new Error(eligibility.reason ?? "LEAD_NOT_ELIGIBLE_FOR_REVIEW");
  }

  if (lead.review?.status === ReviewStatus.MORE_INFO_REQUIRED) {
    const updated = await prisma.review.update({
      where: { leadId: input.leadId },
      data: {
        rating: input.rating,
        title: input.title.trim(),
        comment: input.comment.trim(),
        status: ReviewStatus.PENDING,
        publishedAt: null,
        moderation: {
          update: {
            status: ReviewStatus.PENDING,
            decisionNote: null,
            reviewedAt: null
          }
        },
        evidence: input.evidenceNote ? {
          create: {
            note: input.evidenceNote.trim(),
            reference: input.evidenceReference?.trim() || null
          }
        } : undefined
      },
      include: { evidence: { orderBy: { createdAt: "asc" } }, client: { select: { displayName: true } } }
    });

    await recordAnalyticsEvent({
      type: AnalyticsEventType.REVIEW_SUBMITTED,
      actorUserId: input.clientUserId,
      businessProfileId: lead.businessProfile.id,
      metadata: {
        reviewId: updated.id,
        leadId: lead.id,
        resubmitted: true
      }
    });

    return mapPublicReview(updated);
  }

  const created = await prisma.review.create({
    data: {
      leadId: lead.id,
      clientUserId: input.clientUserId,
      businessProfileId: lead.businessProfile.id,
      rating: input.rating,
      title: input.title.trim(),
      comment: input.comment.trim(),
      evidence: input.evidenceNote ? {
        create: {
          note: input.evidenceNote.trim(),
          reference: input.evidenceReference?.trim() || null
        }
      } : undefined,
      moderation: {
        create: {
          status: ReviewStatus.PENDING
        }
      }
    },
    include: { evidence: { orderBy: { createdAt: "asc" } }, client: { select: { displayName: true } } }
  });

  await recordAnalyticsEvent({
    type: AnalyticsEventType.REVIEW_SUBMITTED,
    actorUserId: input.clientUserId,
    businessProfileId: lead.businessProfile.id,
    metadata: {
      reviewId: created.id,
      leadId: lead.id,
      resubmitted: false
    }
  });

  return mapPublicReview(created);
}

export async function addReviewEvidence(input: {
  clientUserId: string;
  reviewId: string;
  note: string;
  reference?: string;
}) {
  await requireClient(input.clientUserId);
  const review = await prisma.review.findUnique({
    where: { id: input.reviewId },
    include: { moderation: true }
  });

  if (!review) throw new Error("REVIEW_NOT_FOUND");
  if (review.clientUserId !== input.clientUserId) throw new Error("REVIEW_ACCESS_FORBIDDEN");
  if (review.status !== ReviewStatus.PENDING && review.status !== ReviewStatus.MORE_INFO_REQUIRED) {
    throw new Error("REVIEW_EVIDENCE_NOT_ALLOWED");
  }

  await prisma.reviewEvidence.create({
    data: {
      reviewId: review.id,
      note: input.note.trim(),
      reference: input.reference?.trim() || null
    }
  });

  if (review.status === ReviewStatus.MORE_INFO_REQUIRED && review.moderation) {
    await prisma.review.update({
      where: { id: review.id },
      data: {
        status: ReviewStatus.PENDING,
        moderation: {
          update: {
            status: ReviewStatus.PENDING,
            decisionNote: null,
            reviewedAt: null
          }
        }
      }
    });
  }

  return getReviewById(review.id);
}

async function getReviewById(reviewId: string) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      client: { select: { displayName: true } },
      evidence: { orderBy: { createdAt: "asc" } }
    }
  });

  if (!review) throw new Error("REVIEW_NOT_FOUND");
  return mapPublicReview(review);
}

export async function listPublicBusinessReviews(businessProfileId: string): Promise<BusinessPublicReviewsView> {
  const reviews = await prisma.review.findMany({
    where: { businessProfileId, status: ReviewStatus.APPROVED },
    include: {
      client: { select: { displayName: true } },
      evidence: { orderBy: { createdAt: "asc" } }
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 12
  });

  const aggregates = await prisma.review.aggregate({
    where: { businessProfileId, status: ReviewStatus.APPROVED },
    _count: { id: true },
    _avg: { rating: true },
    _max: { publishedAt: true }
  });

  return {
    summary: mapSummary({
      approvedCount: aggregates._count.id,
      averageRating: aggregates._avg.rating,
      latestPublishedAt: aggregates._max.publishedAt
    }),
    items: reviews.map(mapPublicReview)
  };
}

export async function listPendingReviewModerationQueue(adminUserId: string): Promise<PendingReviewModerationView[]> {
  await requireAdmin(adminUserId);
  const items = await prisma.review.findMany({
    where: { status: ReviewStatus.PENDING },
    include: {
      client: { select: { displayName: true } },
      businessProfile: { select: { id: true, businessName: true } },
      evidence: { orderBy: { createdAt: "desc" }, take: 1 }
    },
    orderBy: { createdAt: "asc" }
  });

  return items.map((review) => ({
    id: review.id,
    leadId: review.leadId,
    businessProfileId: review.businessProfile.id,
    businessName: review.businessProfile.businessName,
    clientDisplayName: review.client.displayName,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    status: mapReviewStatus(review.status),
    createdAt: review.createdAt.toISOString(),
    evidenceCount: review.evidence.length,
    lastEvidenceNote: review.evidence[0]?.note ?? null
  }));
}

async function moderateReview(input: {
  adminUserId: string;
  reviewId: string;
  nextStatus: "APPROVED" | "MORE_INFO_REQUIRED" | "REJECTED";
  decisionNote?: string;
}) {
  await requireAdmin(input.adminUserId);
  const review = await prisma.review.findUnique({
    where: { id: input.reviewId },
    include: { moderation: true }
  });

  if (!review) throw new Error("REVIEW_NOT_FOUND");
  if (review.status !== ReviewStatus.PENDING) throw new Error("REVIEW_MODERATION_NOT_ALLOWED");

  const updated = await prisma.review.update({
    where: { id: review.id },
    data: {
      status: input.nextStatus,
      publishedAt: input.nextStatus === ReviewStatus.APPROVED ? new Date() : null,
      moderation: review.moderation ? {
        update: {
          assignedAdminId: input.adminUserId,
          reviewedByUserId: input.adminUserId,
          status: input.nextStatus,
          decisionNote: input.decisionNote?.trim() || null,
          reviewedAt: new Date()
        }
      } : {
        create: {
          assignedAdminId: input.adminUserId,
          reviewedByUserId: input.adminUserId,
          status: input.nextStatus,
          decisionNote: input.decisionNote?.trim() || null,
          reviewedAt: new Date()
        }
      }
    }
  });

  await recalculateBusinessTrustScore(updated.businessProfileId, input.adminUserId, `Review moderation: ${input.nextStatus.toLowerCase()}`);

  return {
    id: updated.id,
    status: mapReviewStatus(updated.status),
    publishedAt: updated.publishedAt?.toISOString() ?? null
  };
}

export async function approveReview(input: { adminUserId: string; reviewId: string; decisionNote?: string }) {
  return moderateReview({ ...input, nextStatus: ReviewStatus.APPROVED });
}

export async function requestMoreInfoForReview(input: { adminUserId: string; reviewId: string; decisionNote?: string }) {
  return moderateReview({ ...input, nextStatus: ReviewStatus.MORE_INFO_REQUIRED });
}

export async function rejectReview(input: { adminUserId: string; reviewId: string; decisionNote?: string }) {
  return moderateReview({ ...input, nextStatus: ReviewStatus.REJECTED });
}