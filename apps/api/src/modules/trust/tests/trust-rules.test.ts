import assert from "node:assert/strict";
import test from "node:test";
import { BadgeLevelCode } from "@prisma/client";
import { computeTrustLeadResponseScore, resolveTrustBadgeLevel } from "@platform/trust";

test("trust thresholds resolve badge levels correctly", () => {
  assert.equal(resolveTrustBadgeLevel(10), BadgeLevelCode.NONE);
  assert.equal(resolveTrustBadgeLevel(45), BadgeLevelCode.BRONZE);
  assert.equal(resolveTrustBadgeLevel(70), BadgeLevelCode.SILVER);
  assert.equal(resolveTrustBadgeLevel(95), BadgeLevelCode.GOLD);
  assert.equal(resolveTrustBadgeLevel(95, true), BadgeLevelCode.NONE);
});

test("lead response scoring rewards timely replies and penalizes overdue leads", () => {
  assert.equal(computeTrustLeadResponseScore({ totalLeadCount: 0, respondedInTimeCount: 0, overdueOpenCount: 0 }), 6);
  assert.equal(computeTrustLeadResponseScore({ totalLeadCount: 10, respondedInTimeCount: 9, overdueOpenCount: 0 }), 9);
  assert.equal(computeTrustLeadResponseScore({ totalLeadCount: 10, respondedInTimeCount: 3, overdueOpenCount: 2 }), 0);
});