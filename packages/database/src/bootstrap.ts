import { randomUUID, scryptSync } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { BadgeLevelCode, UserRole, VerificationStatus } from "@prisma/client";
import { prisma } from "./client";

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function computeDiscoveryScore(input: {
  isPublished: boolean;
  isApproved: boolean;
  headline?: string | null;
  description?: string | null;
  categoriesCount: number;
  servicesCount: number;
  portfolioCount: number;
  yearsInBusiness?: number | null;
  city?: string | null;
}) {
  if (!input.isPublished) {
    return 0;
  }

  let score = 25;

  if (input.isApproved) {
    score += 30;
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

  return score;
}

function hashPassword(password: string) {
  const salt = randomUUID();
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

export async function ensureCoreSeedData(db: PrismaClient = prisma) {
  const settings = [
    { key: "allowNewBusinessRegistrations", value: true },
    { key: "requireManualReviewForAllReviews", value: true },
    { key: "publicSupportEmail", value: "contato@exemplo.com" },
    { key: "defaultLocale", value: "pt-BR" }
  ];

  for (const setting of settings) {
    await db.platformSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value }
    });
  }

  const admin = await db.user.upsert({
    where: { email: "admin@plataforma.local" },
    update: {
      role: UserRole.ADMIN,
      fullName: "Administrador da Plataforma",
      displayName: "Administrador da Plataforma",
      phone: "11999999999",
      passwordHash: hashPassword("Admin12345!"),
      cpf: "12345678909",
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      verificationStatus: VerificationStatus.APPROVED
    },
    create: {
      role: UserRole.ADMIN,
      fullName: "Administrador da Plataforma",
      displayName: "Administrador da Plataforma",
      email: "admin@plataforma.local",
      phone: "11999999999",
      passwordHash: hashPassword("Admin12345!"),
      cpf: "12345678909",
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      verificationStatus: VerificationStatus.APPROVED
    }
  });

  await db.verificationRequest.upsert({
    where: { userId: admin.id },
    update: {
      status: VerificationStatus.APPROVED,
      notes: "Seeded administrator account"
    },
    create: {
      userId: admin.id,
      status: VerificationStatus.APPROVED,
      notes: "Seeded administrator account"
    }
  });

  const business = await db.user.upsert({
    where: { email: "negocio-seed@plataforma.local" },
    update: {
      role: UserRole.BUSINESS,
      fullName: "Negocio Seed",
      displayName: "Negocio Seed",
      businessName: "Negocio Seed",
      legalRepresentativeName: "Responsavel Seed",
      legalRepresentativeCpf: "52998224725",
      phone: "11888887777",
      passwordHash: hashPassword("Business123!"),
      cnpj: "45723174000110",
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      verificationStatus: VerificationStatus.APPROVED
    },
    create: {
      role: UserRole.BUSINESS,
      fullName: "Negocio Seed",
      displayName: "Negocio Seed",
      businessName: "Negocio Seed",
      legalRepresentativeName: "Responsavel Seed",
      legalRepresentativeCpf: "52998224725",
      email: "negocio-seed@plataforma.local",
      phone: "11888887777",
      passwordHash: hashPassword("Business123!"),
      cnpj: "45723174000110",
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      verificationStatus: VerificationStatus.APPROVED,
      businessOwner: {
        create: {
          fullName: "Responsavel Seed",
          cpf: "52998224725"
        }
      }
    }
  });

  await db.verificationRequest.upsert({
    where: { userId: business.id },
    update: {
      status: VerificationStatus.APPROVED,
      notes: "Seeded business account"
    },
    create: {
      userId: business.id,
      status: VerificationStatus.APPROVED,
      notes: "Seeded business account"
    }
  });

  const profile = await db.businessProfile.upsert({
    where: { userId: business.id },
    update: {
      slug: normalizeSlug(business.businessName ?? business.displayName),
      businessName: business.businessName ?? business.displayName,
      headline: "Pintura residencial e comercial com confianca local",
      description: "Perfil seed para destravar o catalogo publico e a edicao inicial do negocio.",
      publicEmail: business.email,
      publicPhone: business.phone,
      city: "Orlando",
      state: "FL",
      serviceArea: "Orlando e cidades vizinhas",
      yearsInBusiness: 8,
      isPublished: true
    },
    create: {
      userId: business.id,
      slug: normalizeSlug(business.businessName ?? business.displayName),
      businessName: business.businessName ?? business.displayName,
      headline: "Pintura residencial e comercial com confianca local",
      description: "Perfil seed para destravar o catalogo publico e a edicao inicial do negocio.",
      publicEmail: business.email,
      publicPhone: business.phone,
      city: "Orlando",
      state: "FL",
      serviceArea: "Orlando e cidades vizinhas",
      yearsInBusiness: 8,
      isPublished: true
    }
  });

  await db.businessCategory.createMany({
    data: [
      { businessProfileId: profile.id, name: "residential-painting", displayOrder: 0 },
      { businessProfileId: profile.id, name: "commercial-painting", displayOrder: 1 }
    ],
    skipDuplicates: true
  });

  await db.businessService.createMany({
    data: [
      {
        businessProfileId: profile.id,
        title: "Pintura interna",
        description: "Preparacao, acabamento fino e protecao de ambientes internos.",
        priceLabel: "Sob orcamento",
        displayOrder: 0
      },
      {
        businessProfileId: profile.id,
        title: "Pintura externa",
        description: "Tratamento de fachada, resistencia climatica e acabamento profissional.",
        priceLabel: "Sob orcamento",
        displayOrder: 1
      }
    ],
    skipDuplicates: true
  });

  await db.portfolioItem.createMany({
    data: [
      {
        businessProfileId: profile.id,
        title: "Fachada residencial premium",
        description: "Projeto seed com foco em contraste, acabamento e durabilidade.",
        mediaUrl: "/portfolio/fachada-seed.jpg",
        displayOrder: 0
      }
    ],
    skipDuplicates: true
  });

  await db.city.upsert({
    where: { slug: normalizeSlug("Orlando") },
    update: {
      name: "Orlando",
      stateCode: "FL",
      isActive: true
    },
    create: {
      slug: normalizeSlug("Orlando"),
      name: "Orlando",
      stateCode: "FL",
      isActive: true
    }
  });

  for (const categorySlug of ["residential-painting", "commercial-painting"]) {
    await db.category.upsert({
      where: { slug: categorySlug },
      update: {
        name: categorySlug.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "),
        isActive: true
      },
      create: {
        slug: categorySlug,
        name: categorySlug.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "),
        isActive: true
      }
    });
  }

  const badgeLevels = [
    { code: BadgeLevelCode.NONE, label: "Sem selo", minScore: 0, description: "Negocio sem classificacao publica de confianca.", displayOrder: 0 },
    { code: BadgeLevelCode.BRONZE, label: "Bronze", minScore: 45, description: "Negocio com base inicial de confianca publicada.", displayOrder: 1 },
    { code: BadgeLevelCode.SILVER, label: "Prata", minScore: 70, description: "Negocio com boa completude e operacao consistente.", displayOrder: 2 },
    { code: BadgeLevelCode.GOLD, label: "Ouro", minScore: 90, description: "Negocio com alta completude e excelente responsividade inicial.", displayOrder: 3 }
  ];

  for (const level of badgeLevels) {
    await db.badgeLevel.upsert({
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
    });
  }

  const silverLevel = await db.badgeLevel.findUnique({ where: { code: BadgeLevelCode.SILVER } });

  if (silverLevel) {
    await db.trustScore.upsert({
      where: { businessProfileId: profile.id },
      update: {
        badgeLevelId: silverLevel.id,
        score: 79,
        isSuspended: false,
        suspensionReason: null,
        verificationPoints: 35,
        profilePoints: 23,
        servicePoints: 10,
        portfolioPoints: 5,
        leadResponsePoints: 6,
        reputationPoints: 0,
        penaltyPoints: 0,
        totalLeadCount: 0,
        respondedLeadCount: 0,
        responseRate: null,
        approvedReviewCount: 0,
        averageRating: null,
        lastCalculatedAt: new Date()
      },
      create: {
        businessProfileId: profile.id,
        badgeLevelId: silverLevel.id,
        score: 79,
        isSuspended: false,
        verificationPoints: 35,
        profilePoints: 23,
        servicePoints: 10,
        portfolioPoints: 5,
        leadResponsePoints: 6,
        reputationPoints: 0,
        penaltyPoints: 0,
        totalLeadCount: 0,
        respondedLeadCount: 0,
        responseRate: null,
        approvedReviewCount: 0,
        averageRating: null,
        lastCalculatedAt: new Date()
      }
    });
  }

  await db.businessSearchIndex.upsert({
    where: { businessProfileId: profile.id },
    update: {
      slug: profile.slug,
      businessName: profile.businessName,
      headline: profile.headline,
      description: profile.description,
      citySlug: normalizeSlug("Orlando"),
      cityName: "Orlando",
      stateCode: "FL",
      categorySlugs: ["residential-painting", "commercial-painting"],
      searchText: [
        profile.businessName,
        profile.headline,
        profile.description,
        "Orlando",
        "FL",
        "residential-painting",
        "commercial-painting"
      ].filter(Boolean).join(" ").toLowerCase(),
      rankingScore: computeDiscoveryScore({
        isPublished: true,
        isApproved: true,
        headline: profile.headline,
        description: profile.description,
        categoriesCount: 2,
        servicesCount: 2,
        portfolioCount: 1,
        yearsInBusiness: 8,
        city: "Orlando"
      }),
      trustScore: 79,
      trustBadge: BadgeLevelCode.SILVER,
      isPublished: true,
      verificationStatus: VerificationStatus.APPROVED
    },
    create: {
      businessProfileId: profile.id,
      slug: profile.slug,
      businessName: profile.businessName,
      headline: profile.headline,
      description: profile.description,
      citySlug: normalizeSlug("Orlando"),
      cityName: "Orlando",
      stateCode: "FL",
      categorySlugs: ["residential-painting", "commercial-painting"],
      searchText: [
        profile.businessName,
        profile.headline,
        profile.description,
        "Orlando",
        "FL",
        "residential-painting",
        "commercial-painting"
      ].filter(Boolean).join(" ").toLowerCase(),
      rankingScore: computeDiscoveryScore({
        isPublished: true,
        isApproved: true,
        headline: profile.headline,
        description: profile.description,
        categoriesCount: 2,
        servicesCount: 2,
        portfolioCount: 1,
        yearsInBusiness: 8,
        city: "Orlando"
      }),
      trustScore: 79,
      trustBadge: BadgeLevelCode.SILVER,
      isPublished: true,
      verificationStatus: VerificationStatus.APPROVED
    }
  });
}

export async function resetDatabaseForTests(db: PrismaClient = prisma) {
  await db.$transaction([
    db.messageAttachment.deleteMany(),
    db.retryQueue.deleteMany(),
    db.webhookDelivery.deleteMany(),
    db.backgroundJob.deleteMany(),
    db.integrationEvent.deleteMany(),
    db.billingEvent.deleteMany(),
    db.campaignAttribution.deleteMany(),
    db.pageSection.deleteMany(),
    db.page.deleteMany(),
    db.seoMetadata.deleteMany(),
    db.payment.deleteMany(),
    db.invoice.deleteMany(),
    db.boost.deleteMany(),
    db.subscription.deleteMany(),
    db.businessReport.deleteMany(),
    db.dailyMetric.deleteMany(),
    db.analyticsEvent.deleteMany(),
    db.notificationDelivery.deleteMany(),
    db.notification.deleteMany(),
    db.notificationPreference.deleteMany(),
    db.campaignRun.deleteMany(),
    db.clientFavorite.deleteMany(),
    db.clientDashboardView.deleteMany(),
    db.providerRecommendation.deleteMany(),
    db.providerDashboardSnapshot.deleteMany(),
    db.moderationDecision.deleteMany(),
    db.moderationCase.deleteMany(),
    db.conversationMessage.deleteMany(),
    db.conversationParticipant.deleteMany(),
    db.conversation.deleteMany(),
    db.storageEvent.deleteMany(),
    db.evidenceLink.deleteMany(),
    db.documentVersion.deleteMany(),
    db.storedFile.deleteMany(),
    db.reviewModeration.deleteMany(),
    db.reviewEvidence.deleteMany(),
    db.review.deleteMany(),
    db.badgePenalty.deleteMany(),
    db.badgeEvent.deleteMany(),
    db.trustScore.deleteMany(),
    db.badgeLevel.deleteMany(),
    db.leadContactRelease.deleteMany(),
    db.leadStatusHistory.deleteMany(),
    db.leadMessage.deleteMany(),
    db.lead.deleteMany(),
    db.searchSnapshot.deleteMany(),
    db.businessSearchIndex.deleteMany(),
    db.auditLog.deleteMany(),
    db.verificationDocument.deleteMany(),
    db.otpCode.deleteMany(),
    db.verificationRequest.deleteMany(),
    db.session.deleteMany(),
    db.businessCategory.deleteMany(),
    db.portfolioItem.deleteMany(),
    db.businessService.deleteMany(),
    db.businessProfile.deleteMany(),
    db.businessOwner.deleteMany(),
    db.user.deleteMany({ where: { email: { notIn: ["admin@plataforma.local", "negocio-seed@plataforma.local"] } } }),
    db.city.deleteMany(),
    db.category.deleteMany(),
    db.platformSetting.deleteMany()
  ]);

  await ensureCoreSeedData(db);
}
