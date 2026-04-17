import assert from "node:assert/strict";
import test from "node:test";
import { LeadStatus } from "@prisma/client";
import { canTransitionLeadStatus, isLeadLate } from "@platform/leads";

test("lead status transition rules allow business workflow progression", () => {
  assert.equal(canTransitionLeadStatus(LeadStatus.OPEN, LeadStatus.VIEWED), true);
  assert.equal(canTransitionLeadStatus(LeadStatus.VIEWED, LeadStatus.RESPONDED), true);
  assert.equal(canTransitionLeadStatus(LeadStatus.RESPONDED, LeadStatus.CONTACT_RELEASED), true);
  assert.equal(canTransitionLeadStatus(LeadStatus.CLOSED, LeadStatus.OPEN), false);
});

test("lead SLA marks unanswered leads older than 24h as late", () => {
  const oldDate = new Date(Date.now() - 26 * 60 * 60 * 1000);
  assert.equal(isLeadLate(oldDate, LeadStatus.OPEN, null), true);
  assert.equal(isLeadLate(oldDate, LeadStatus.RESPONDED, new Date()), false);
});