import "dotenv/config";
import {
  ProviderRecommendationPriority,
  ProviderSubscriptionStatus,
  ReviewStatus,
  SubscriptionStatus,
  type LeadStatus
} from "@prisma/client";
import { prisma } from "../../database/src";
import { getBusinessBadgeStatus } from "@platform/trust";

export type ProviderDashboardPendingAction = {
  code: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  href: string;
};

export type ProviderDashboardRecommendation = {
  code: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
};

export type ProviderDashboardOverview = {
  businessProfileId: string;
  businessName: string;
  businessSlug: string;
  subscriptionStatus: string;
  isProfilePublished: boolean;
  badge: {
    code: string;
    label: string;
    score: number;
    isSuspended: boolean;
  };
  kpis: {
    openLeadsCount: number;
    lateLeadsCount: number;
    respondedLeadsCount: number;
    approvedReviewsCount: number;
    pendingReviewsCount: number;
    responseRate: number | null;
  };
  pendingActionsCount: number;
  recommendationCount: number;
};

export type ProviderDashboardPerformance = {
  overview: ProviderDashboardOverview;
  recentSnapshots: Array<{
    snapshotDate: string;
    trustScore: number;
    openLeadsCount: number;
    lateLeadsCount: number;
    approvedReviewsCount: number;
    pendingActionsCount: number;
  }>;
};

type ProviderDashboardComputedState = {
  overview: ProviderDashboardOverview;
  pendingActions: ProviderDashboardPendingAction[];
  recommendations: ProviderDashboardRecommendation[];
};

function toPriority(value: ProviderRecommendationPriority): "high" | "medium" | "low" {
  if (value === ProviderRecommendationPriority.HIGH) return "high";
  if (value === ProviderRecommendationPriority.LOW) return "low";
  return "medium";
}

function fromPriority(value: "high" | "medium" | "low") {
  if (value === "high") return ProviderRecommendationPriority.HIGH;
  if (value === "low") return ProviderRecommendationPriority.LOW;
  return ProviderRecommendationPriority.MEDIUM;
}

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function computeProviderPendingActions(input: {
  verificationStatus: string;
  subscriptionStatus: string;
  isProfilePublished: boolean;
  servicesCount: number;
  portfolioCount: number;
  openLeadsCount: number;
  lateLeadsCount: number;
  approvedReviewsCount: number;
  pendingItems: string[];
}): ProviderDashboardPendingAction[] {
  const actions: ProviderDashboardPendingAction[] = [];

  if (input.verificationStatus !== "approved") {
    actions.push({
      code: "complete-verification",
      title: "Complete sua verificacao",
      description: "Finalize verificacao e documentacao para aumentar confianca e liberar todo o potencial do selo.",
      priority: "high",
      href: "/verification"
    });
  }

  if (input.subscriptionStatus !== "active") {
    actions.push({
      code: "activate-subscription",
      title: "Ative seu plano comercial",
      description: "A assinatura ativa libera beneficios comerciais e reduz risco de perda de exposicao por billing pendente.",
      priority: input.subscriptionStatus === "past_due" ? "high" : "medium",
      href: "/dashboard/billing"
    });
  }

  if (!input.isProfilePublished) {
    actions.push({
      code: "publish-profile",
      title: "Publique seu perfil",
      description: "Seu negocio ainda nao esta visivel no catalogo publico.",
      priority: "high",
      href: "/dashboard/business-profile"
    });
  }

  if (input.servicesCount === 0) {
    actions.push({
      code: "add-services",
      title: "Adicione servicos",
      description: "Negocios com servicos cadastrados convertem melhor em busca e leads.",
      priority: "high",
      href: "/dashboard/business-profile"
    });
  }

  if (input.portfolioCount === 0) {
    actions.push({
      code: "add-portfolio",
      title: "Monte seu portfolio",
      description: "Portfolio publicado ajuda o cliente a confiar antes do primeiro contato.",
      priority: "medium",
      href: "/dashboard/business-profile"
    });
  }

  if (input.lateLeadsCount > 0) {
    actions.push({
      code: "recover-sla",
      title: "Recupere leads fora do SLA",
      description: `${input.lateLeadsCount} lead(s) aguardam resposta alem do prazo esperado.`,
      priority: "high",
      href: "/dashboard/leads/inbox"
    });
  } else if (input.openLeadsCount > 0) {
    actions.push({
      code: "answer-open-leads",
      title: "Responda leads abertos",
      description: `${input.openLeadsCount} lead(s) ainda aguardam tratativa comercial.`,
      priority: "high",
      href: "/dashboard/leads/inbox"
    });
  }

  if (input.approvedReviewsCount === 0) {
    actions.push({
      code: "earn-first-review",
      title: "Busque sua primeira review",
      description: "A primeira review publicada ajuda reputacao e aumenta confianca do perfil.",
      priority: "medium",
      href: "/dashboard/leads/inbox"
    });
  }

  for (const item of input.pendingItems.slice(0, 3)) {
    actions.push({
      code: `trust-gap-${item.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      title: "Melhore sua completude",
      description: item,
      priority: "low",
      href: "/dashboard/business-profile"
    });
  }

  return actions;
}

export function computeProviderRecommendations(actions: ProviderDashboardPendingAction[]): ProviderDashboardRecommendation[] {
  return actions.slice(0, 5).map((action) => ({
    code: action.code,
    title: action.title,
    description: action.description,
    priority: action.priority
  }));
}

async function loadBusinessDashboardSource(userId: string) {
  const profile = await prisma.businessProfile.findUnique({
    where: { userId },
    include: {
      user: true,
      services: { select: { id: true } },
      portfolioItems: { select: { id: true } },
      trustScore: { include: { badgeLevel: true } },
      reviews: { select: { status: true } },
      receivedLeads: { select: { status: true, createdAt: true, respondedAt: true } }
    }
  });

  if (!profile || profile.user.role !== "BUSINESS") {
    throw new Error("BUSINESS_ROLE_REQUIRED");
  }

  return profile;
}

function computeResponseRate(leads: Array<{ status: LeadStatus; respondedAt: Date | null }>) {
  if (leads.length === 0) {
    return null;
  }

  const respondedCount = leads.filter((lead) => Boolean(lead.respondedAt)).length;
  return Math.round((respondedCount / leads.length) * 100);
}

async function syncProviderDashboardState(userId: string): Promise<ProviderDashboardComputedState> {
  const trustStatus = await getBusinessBadgeStatus(userId);
  const profile = await loadBusinessDashboardSource(userId);
  const subscription = await prisma.subscription.findUnique({
    where: { businessProfileId: profile.id },
    select: { status: true }
  });
  const providerSubscriptionStatus = subscription?.status === SubscriptionStatus.ACTIVE
    ? ProviderSubscriptionStatus.ACTIVE
    : subscription?.status === SubscriptionStatus.PAST_DUE
      ? ProviderSubscriptionStatus.PAST_DUE
      : subscription?.status === SubscriptionStatus.CANCELED
        ? ProviderSubscriptionStatus.CANCELED
        : subscription?.status === SubscriptionStatus.INCOMPLETE
          ? ProviderSubscriptionStatus.TRIAL
          : ProviderSubscriptionStatus.NOT_ENABLED;

  const openLeadsCount = profile.receivedLeads.filter((lead) => lead.status === "OPEN" || lead.status === "VIEWED").length;
  const lateLeadsCount = profile.receivedLeads.filter((lead) => {
    if (lead.respondedAt) return false;
    const ageHours = (Date.now() - lead.createdAt.getTime()) / (1000 * 60 * 60);
    return ageHours > 24;
  }).length;
  const respondedLeadsCount = profile.receivedLeads.filter((lead) => Boolean(lead.respondedAt)).length;
  const approvedReviewsCount = profile.reviews.filter((review) => review.status === ReviewStatus.APPROVED).length;
  const pendingReviewsCount = profile.reviews.filter((review) => review.status === ReviewStatus.PENDING || review.status === ReviewStatus.MORE_INFO_REQUIRED).length;
  const pendingActions = computeProviderPendingActions({
    verificationStatus: trustStatus.businessSlug ? profile.user.verificationStatus.toLowerCase() : "pending_review",
    subscriptionStatus: providerSubscriptionStatus.toLowerCase(),
    isProfilePublished: profile.isPublished,
    servicesCount: profile.services.length,
    portfolioCount: profile.portfolioItems.length,
    openLeadsCount,
    lateLeadsCount,
    approvedReviewsCount,
    pendingItems: trustStatus.pendingItems
  });
  const recommendations = computeProviderRecommendations(pendingActions);
  const overview: ProviderDashboardOverview = {
    businessProfileId: profile.id,
    businessName: profile.businessName,
    businessSlug: profile.slug,
    subscriptionStatus: providerSubscriptionStatus.toLowerCase(),
    isProfilePublished: profile.isPublished,
    badge: {
      code: trustStatus.badgeCode,
      label: trustStatus.badgeLabel,
      score: trustStatus.score,
      isSuspended: trustStatus.isSuspended
    },
    kpis: {
      openLeadsCount,
      lateLeadsCount,
      respondedLeadsCount,
      approvedReviewsCount,
      pendingReviewsCount,
      responseRate: computeResponseRate(profile.receivedLeads)
    },
    pendingActionsCount: pendingActions.length,
    recommendationCount: recommendations.length
  };

  const snapshotDate = startOfUtcDay();

  await prisma.$transaction(async (transaction) => {
    await transaction.providerDashboardSnapshot.upsert({
      where: {
        businessProfileId_snapshotDate: {
          businessProfileId: profile.id,
          snapshotDate
        }
      },
      update: {
        subscriptionStatus: providerSubscriptionStatus,
        isProfilePublished: profile.isPublished,
        trustScore: trustStatus.score,
        openLeadsCount,
        lateLeadsCount,
        respondedLeadsCount,
        approvedReviewsCount,
        pendingReviewsCount,
        pendingActionsCount: pendingActions.length
      },
      create: {
        businessProfileId: profile.id,
        snapshotDate,
        subscriptionStatus: providerSubscriptionStatus,
        isProfilePublished: profile.isPublished,
        trustScore: trustStatus.score,
        openLeadsCount,
        lateLeadsCount,
        respondedLeadsCount,
        approvedReviewsCount,
        pendingReviewsCount,
        pendingActionsCount: pendingActions.length
      }
    });

    await transaction.providerRecommendation.updateMany({
      where: { businessProfileId: profile.id },
      data: { isActive: false }
    });

    for (const recommendation of recommendations) {
      await transaction.providerRecommendation.upsert({
        where: {
          businessProfileId_code: {
            businessProfileId: profile.id,
            code: recommendation.code
          }
        },
        update: {
          title: recommendation.title,
          description: recommendation.description,
          priority: fromPriority(recommendation.priority),
          isActive: true
        },
        create: {
          businessProfileId: profile.id,
          code: recommendation.code,
          title: recommendation.title,
          description: recommendation.description,
          priority: fromPriority(recommendation.priority),
          isActive: true
        }
      });
    }
  });

  return { overview, pendingActions, recommendations };
}

export async function getProviderDashboardOverview(userId: string) {
  return (await syncProviderDashboardState(userId)).overview;
}

export async function listProviderDashboardRecommendations(userId: string) {
  const state = await syncProviderDashboardState(userId);
  const stored = await prisma.providerRecommendation.findMany({
    where: { businessProfileId: state.overview.businessProfileId, isActive: true },
    orderBy: [{ priority: "asc" }, { updatedAt: "desc" }]
  });

  return stored.map((item) => ({
    code: item.code,
    title: item.title,
    description: item.description,
    priority: toPriority(item.priority)
  }));
}

export async function listProviderDashboardPendingActions(userId: string) {
  return (await syncProviderDashboardState(userId)).pendingActions;
}

export async function getProviderDashboardPerformance(userId: string): Promise<ProviderDashboardPerformance> {
  const state = await syncProviderDashboardState(userId);
  const snapshots = await prisma.providerDashboardSnapshot.findMany({
    where: { businessProfileId: state.overview.businessProfileId },
    orderBy: { snapshotDate: "desc" },
    take: 7
  });

  return {
    overview: state.overview,
    recentSnapshots: snapshots.map((snapshot) => ({
      snapshotDate: snapshot.snapshotDate.toISOString(),
      trustScore: snapshot.trustScore,
      openLeadsCount: snapshot.openLeadsCount,
      lateLeadsCount: snapshot.lateLeadsCount,
      approvedReviewsCount: snapshot.approvedReviewsCount,
      pendingActionsCount: snapshot.pendingActionsCount
    }))
  };
}
