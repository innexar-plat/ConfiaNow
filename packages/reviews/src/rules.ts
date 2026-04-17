import { ReviewStatus } from "@prisma/client";

export function evaluateLeadReviewEligibility(input: {
  leadClientUserId: string;
  actorUserId: string;
  contactReleasedAt: Date | null;
  existingReviewStatus?: ReviewStatus | null;
}) {
  if (input.leadClientUserId !== input.actorUserId) {
    return { canReview: false, reason: "REVIEW_ACCESS_FORBIDDEN" };
  }

  if (!input.contactReleasedAt) {
    return { canReview: false, reason: "LEAD_NOT_ELIGIBLE_FOR_REVIEW" };
  }

  if (input.existingReviewStatus && input.existingReviewStatus !== ReviewStatus.MORE_INFO_REQUIRED) {
    return { canReview: false, reason: "REVIEW_ALREADY_EXISTS" };
  }

  return { canReview: true, reason: null };
}
