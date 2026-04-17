import { VerificationStatus } from "@prisma/client";

export function normalizeDiscoverySlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function computeDiscoveryScore(input: {
  isPublished: boolean;
  verificationStatus: VerificationStatus;
  headline?: string | null;
  description?: string | null;
  categoriesCount: number;
  servicesCount: number;
  portfolioCount: number;
  yearsInBusiness?: number | null;
  city?: string | null;
  trustScore?: number;
}) {
  if (!input.isPublished) {
    return 0;
  }

  let score = 25;

  if (input.verificationStatus === VerificationStatus.APPROVED) {
    score += 30;
  } else if (input.verificationStatus === VerificationStatus.PENDING_REVIEW) {
    score += 12;
  }

  if (input.headline) {
    score += 10;
  }

  if (input.description) {
    score += 10;
  }

  if (input.city) {
    score += 8;
  }

  score += Math.min(8, input.categoriesCount * 2);
  score += Math.min(10, input.servicesCount * 2);
  score += Math.min(12, input.portfolioCount * 4);
  score += Math.min(10, Math.max(0, input.yearsInBusiness ?? 0));
  score += Math.min(20, (input.trustScore ?? 0) * 0.2);

  return score;
}
