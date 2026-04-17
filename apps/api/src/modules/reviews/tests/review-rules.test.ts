import assert from "node:assert/strict";
import test from "node:test";
import { ReviewStatus } from "@prisma/client";
import { evaluateLeadReviewEligibility } from "@platform/reviews";
import { computeTrustReputationScore } from "@platform/trust";

test("lead review eligibility requires released contact and blocks duplicate approved review", () => {
  assert.deepEqual(
    evaluateLeadReviewEligibility({
      leadClientUserId: "client-1",
      actorUserId: "client-1",
      contactReleasedAt: new Date(),
      existingReviewStatus: null
    }),
    { canReview: true, reason: null }
  );

  assert.equal(
    evaluateLeadReviewEligibility({
      leadClientUserId: "client-1",
      actorUserId: "client-1",
      contactReleasedAt: null,
      existingReviewStatus: null
    }).reason,
    "LEAD_NOT_ELIGIBLE_FOR_REVIEW"
  );

  assert.equal(
    evaluateLeadReviewEligibility({
      leadClientUserId: "client-1",
      actorUserId: "client-2",
      contactReleasedAt: new Date(),
      existingReviewStatus: null
    }).reason,
    "REVIEW_ACCESS_FORBIDDEN"
  );

  assert.equal(
    evaluateLeadReviewEligibility({
      leadClientUserId: "client-1",
      actorUserId: "client-1",
      contactReleasedAt: new Date(),
      existingReviewStatus: ReviewStatus.APPROVED
    }).reason,
    "REVIEW_ALREADY_EXISTS"
  );

  assert.equal(
    evaluateLeadReviewEligibility({
      leadClientUserId: "client-1",
      actorUserId: "client-1",
      contactReleasedAt: new Date(),
      existingReviewStatus: ReviewStatus.MORE_INFO_REQUIRED
    }).canReview,
    true
  );
});

test("reputation scoring rewards approved volume and rating", () => {
  assert.equal(computeTrustReputationScore({ approvedReviewCount: 0, averageRating: null }), 0);
  assert.equal(computeTrustReputationScore({ approvedReviewCount: 1, averageRating: 5 }), 15);
  assert.equal(computeTrustReputationScore({ approvedReviewCount: 6, averageRating: 4.5 }) >= 18, true);
});