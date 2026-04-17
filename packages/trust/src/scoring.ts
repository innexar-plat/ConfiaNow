import { BadgeLevelCode } from "@prisma/client";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function computeTrustLeadResponseScore(input: {
  totalLeadCount: number;
  respondedInTimeCount: number;
  overdueOpenCount: number;
}) {
  if (input.totalLeadCount === 0) {
    return 6;
  }

  const responseRate = input.respondedInTimeCount / input.totalLeadCount;
  return clamp(Math.round(responseRate * 10) - Math.min(4, input.overdueOpenCount * 2), 0, 10);
}

export function computeTrustReputationScore(input: {
  approvedReviewCount: number;
  averageRating: number | null;
}) {
  if (input.approvedReviewCount === 0 || input.averageRating === null) {
    return 0;
  }

  const ratingPoints = Math.round((input.averageRating / 5) * 14);
  const consistencyPoints = Math.min(6, input.approvedReviewCount);
  return clamp(ratingPoints + consistencyPoints, 0, 20);
}

export function resolveTrustBadgeLevel(score: number, isSuspended = false) {
  if (isSuspended) {
    return BadgeLevelCode.NONE;
  }

  if (score >= 90) {
    return BadgeLevelCode.GOLD;
  }

  if (score >= 70) {
    return BadgeLevelCode.SILVER;
  }

  if (score >= 45) {
    return BadgeLevelCode.BRONZE;
  }

  return BadgeLevelCode.NONE;
}
