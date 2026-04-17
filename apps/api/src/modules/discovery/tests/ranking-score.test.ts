import assert from "node:assert/strict";
import test from "node:test";
import { VerificationStatus } from "@prisma/client";
import { computeDiscoveryScore } from "@platform/discovery";

test("computeDiscoveryScore rewards published and complete approved profiles", () => {
  const complete = computeDiscoveryScore({
    isPublished: true,
    verificationStatus: VerificationStatus.APPROVED,
    headline: "Especialistas em pintura premium",
    description: "Atendimento completo com portfolio e servicos publicados",
    categoriesCount: 3,
    servicesCount: 4,
    portfolioCount: 3,
    yearsInBusiness: 10,
    city: "Orlando"
  });

  const incomplete = computeDiscoveryScore({
    isPublished: true,
    verificationStatus: VerificationStatus.PENDING_REVIEW,
    categoriesCount: 1,
    servicesCount: 0,
    portfolioCount: 0,
    yearsInBusiness: 0,
    city: null
  });

  assert.equal(complete > incomplete, true);
});

test("computeDiscoveryScore returns zero for unpublished profiles", () => {
  assert.equal(computeDiscoveryScore({
    isPublished: false,
    verificationStatus: VerificationStatus.APPROVED,
    categoriesCount: 3,
    servicesCount: 2,
    portfolioCount: 2,
    yearsInBusiness: 5,
    city: "Orlando"
  }), 0);
});