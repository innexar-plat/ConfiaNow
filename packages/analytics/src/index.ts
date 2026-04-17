import "dotenv/config";
import {
  AnalyticsEventType,
  BoostStatus,
  DailyMetricScope,
  ReviewStatus,
  SubscriptionStatus,
  UserRole,
  type Prisma
} from "@prisma/client";
import { prisma } from "@platform/database";

type NullableDateInput = Date | string | null | undefined;

export type AnalyticsDateRangeInput = {
  from?: NullableDateInput;
  to?: NullableDateInput;
  days?: number;
};

export type AnalyticsDateRange = {
  start: Date;
  endInclusive: Date;
  endExclusive: Date;
};

export type AnalyticsEventInput = {
  type: AnalyticsEventType;
  actorUserId?: string | null;
  businessProfileId?: string | null;
  categorySlug?: string | null;
  citySlug?: string | null;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
};

export type AdminAnalyticsOverview = {
  periodStart: string;
  periodEnd: string;
  totals: {
    newClientsCount: number;
    newBusinessesCount: number;
    verifiedActiveBusinessesCount: number;
    activeProfilesCount: number;
    profileViewsCount: number;
    contactClicksCount: number;
    leadsCreatedCount: number;
    respondedLeadsCount: number;
    averageResponseHours: number | null;
    openReportsCount: number;
    reportsRatePercent: number;
    approvedReviewsCount: number;
    rejectedReviewsCount: number;
    moreInfoReviewsCount: number;
    averageReviewModerationHours: number | null;
    activeSubscriptionsCount: number;
    activeBoostsCount: number;
  };
  series: Array<{
    date: string;
    newClientsCount: number;
    newBusinessesCount: number;
    profileViewsCount: number;
    contactClicksCount: number;
    leadsCreatedCount: number;
    approvedReviewsCount: number;
  }>;
  topDemandByRegion: Array<{
    citySlug: string | null;
    categorySlug: string | null;
    searchesCount: number;
  }>;
};

export type AdminAnalyticsFunnel = {
  periodStart: string;
  periodEnd: string;
  steps: Array<{
    code: string;
    label: string;
    count: number;
    conversionFromPrevious: number | null;
    conversionFromFirst: number | null;
  }>;
};

export type BusinessAnalyticsOverview = {
  periodStart: string;
  periodEnd: string;
  businessProfileId: string;
  businessName: string;
  summary: {
    profileViewsCount: number;
    contactClicksCount: number;
    leadsReceivedCount: number;
    respondedLeadsCount: number;
    responseRate: number;
    averageResponseHours: number | null;
    trustScoreLatest: number;
    trustScoreAverage: number | null;
    approvedReviewsCount: number;
    averageRating: number | null;
    platformAverageRating: number | null;
    platformAverageResponseRate: number | null;
    activeBoostCount: number;
    demandHighlights: string[];
    subscriptionStatus: string;
  };
  daily: Array<{
    date: string;
    profileViewsCount: number;
    contactClicksCount: number;
    leadsReceivedCount: number;
    respondedLeadsCount: number;
    approvedReviewsCount: number;
    trustScore: number;
  }>;
};

export type BusinessAnalyticsLeads = {
  periodStart: string;
  periodEnd: string;
  businessProfileId: string;
  totals: {
    leadsReceivedCount: number;
    respondedLeadsCount: number;
    openLeadsCount: number;
    contactReleasedCount: number;
    responseRate: number;
    averageResponseHours: number | null;
  };
  daily: Array<{
    date: string;
    leadsReceivedCount: number;
    respondedLeadsCount: number;
    contactReleasedCount: number;
  }>;
  topSubjects: Array<{
    term: string;
    count: number;
  }>;
};

export type BusinessAnalyticsReputation = {
  periodStart: string;
  periodEnd: string;
  businessProfileId: string;
  summary: {
    trustScoreLatest: number;
    trustScoreAverage: number | null;
    approvedReviewsCount: number;
    pendingReviewsCount: number;
    rejectedReviewsCount: number;
    averageRating: number | null;
    platformAverageRating: number | null;
  };
  daily: Array<{
    date: string;
    trustScore: number;
    approvedReviewsCount: number;
    averageRating: number | null;
  }>;
};

export type BusinessAnalyticsExport = {
  filename: string;
  contentType: string;
  csv: string;
};

const PLATFORM_SCOPE_KEY = "platform";

const STOP_WORDS = new Set([
  "a",
  "ao",
  "aos",
  "as",
  "com",
  "da",
  "das",
  "de",
  "del",
  "do",
  "dos",
  "e",
  "el",
  "em",
  "en",
  "for",
  "la",
  "las",
  "lo",
  "los",
  "na",
  "nas",
  "no",
  "nos",
  "o",
  "os",
  "para",
  "por",
  "que",
  "quiero",
  "se",
  "sem",
  "servico",
  "servicos",
  "service",
  "services",
  "the",
  "uma",
  "um",
  "y"
]);

function toJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (typeof value === "undefined") {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
}

function round(value: number | null | undefined, decimals = 2) {
  if (value === null || typeof value === "undefined" || Number.isNaN(value)) {
    return null;
  }

  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function parseDateInput(input: NullableDateInput) {
  if (!input) {
    return null;
  }

  if (input instanceof Date) {
    return new Date(input);
  }

  const normalized = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [year, month, day] = normalized.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("INVALID_ANALYTICS_DATE_RANGE");
  }

  return parsed;
}

export function resolveAnalyticsDateRange(input: AnalyticsDateRangeInput = {}): AnalyticsDateRange {
  const today = startOfUtcDay(new Date());
  const days = Math.max(1, Math.min(input.days ?? 30, 180));
  const parsedFrom = parseDateInput(input.from);
  const parsedTo = parseDateInput(input.to);
  const endDate = parsedTo ? startOfUtcDay(parsedTo) : today;
  const startDate = parsedFrom ? startOfUtcDay(parsedFrom) : new Date(endDate);

  if (!parsedFrom) {
    startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
  }

  if (startDate > endDate) {
    throw new Error("INVALID_ANALYTICS_DATE_RANGE");
  }

  const endExclusive = new Date(endDate);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

  return {
    start: startDate,
    endInclusive: new Date(endExclusive.getTime() - 1),
    endExclusive
  };
}

function enumerateDays(range: AnalyticsDateRange) {
  const days: Date[] = [];
  const cursor = new Date(range.start);

  while (cursor < range.endExclusive) {
    days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

function formatDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function hoursBetween(start: Date, end: Date) {
  return (end.getTime() - start.getTime()) / 3600000;
}

function sumMetricValues(metrics: Array<{ metricValue: number }>) {
  return metrics.reduce((total, metric) => total + metric.metricValue, 0);
}

function metricMap(metrics: Array<{ metricKey: string; metricValue: number; metricDate: Date; metadata: Prisma.JsonValue | null }>) {
  return new Map(metrics.map((metric) => [`${formatDay(metric.metricDate)}:${metric.metricKey}`, metric]));
}

function getMetricValue(
  metrics: Map<string, { metricValue: number }>,
  day: Date,
  metricKey: string
) {
  return metrics.get(`${formatDay(day)}:${metricKey}`)?.metricValue ?? 0;
}

function averageMetricValue(metrics: Array<{ metricValue: number }>, predicate?: (metric: { metricValue: number }) => boolean) {
  const filtered = predicate ? metrics.filter(predicate) : metrics;
  if (filtered.length === 0) {
    return null;
  }

  return round(filtered.reduce((total, metric) => total + metric.metricValue, 0) / filtered.length);
}

function extractDemandHighlights(texts: string[]) {
  const counts = new Map<string, number>();

  for (const text of texts) {
    for (const token of text
      .toLowerCase()
      .replace(/[^a-z0-9áàâãéêíóôõúçñü\s-]/gi, " ")
      .split(/\s+/)
      .map((item) => item.trim())
      .filter((item) => item.length >= 4 && !STOP_WORDS.has(item))) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 5)
    .map(([term]) => term);
}

function escapeCsv(value: string | number | null) {
  if (value === null) {
    return "";
  }

  const stringValue = String(value);
  if (!/[",\n]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replace(/"/g, '""')}"`;
}

async function getBusinessProfileByUserId(userId: string) {
  const profile = await prisma.businessProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      businessName: true,
      slug: true,
      categories: { select: { name: true } }
    }
  });

  if (!profile) {
    throw new Error("BUSINESS_PROFILE_NOT_FOUND");
  }

  return profile;
}

async function getBusinessComparableIds(businessProfileId: string) {
  const categories = await prisma.businessCategory.findMany({
    where: { businessProfileId },
    select: { name: true }
  });

  if (categories.length === 0) {
    const all = await prisma.businessProfile.findMany({ select: { id: true } });
    return all.map((item) => item.id);
  }

  const matches = await prisma.businessCategory.findMany({
    where: { name: { in: categories.map((item) => item.name) } },
    select: { businessProfileId: true },
    distinct: ["businessProfileId"]
  });

  return matches.map((item) => item.businessProfileId);
}

async function upsertDailyMetric(input: {
  metricDate: Date;
  scope: DailyMetricScope;
  scopeKey: string;
  metricKey: string;
  metricValue: number;
  businessProfileId?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.dailyMetric.upsert({
    where: {
      metricDate_scope_scopeKey_metricKey: {
        metricDate: input.metricDate,
        scope: input.scope,
        scopeKey: input.scopeKey,
        metricKey: input.metricKey
      }
    },
    update: {
      metricValue: input.metricValue,
      metadata: toJsonValue(input.metadata)
    },
    create: {
      metricDate: input.metricDate,
      scope: input.scope,
      scopeKey: input.scopeKey,
      metricKey: input.metricKey,
      metricValue: input.metricValue,
      businessProfileId: input.businessProfileId,
      metadata: toJsonValue(input.metadata)
    }
  });
}

export async function recordAnalyticsEvent(input: AnalyticsEventInput) {
  return prisma.analyticsEvent.create({
    data: {
      type: input.type,
      actorUserId: input.actorUserId ?? null,
      businessProfileId: input.businessProfileId ?? null,
      categorySlug: input.categorySlug ?? null,
      citySlug: input.citySlug ?? null,
      metadata: toJsonValue(input.metadata),
      occurredAt: input.occurredAt ?? new Date()
    }
  });
}

export async function trackPublicProfileView(input: {
  businessSlug: string;
  actorUserId?: string | null;
}) {
  const indexEntry = await prisma.businessSearchIndex.findFirst({
    where: { slug: input.businessSlug },
    select: {
      businessProfileId: true,
      citySlug: true,
      categorySlugs: true
    }
  });

  if (!indexEntry) {
    return null;
  }

  return recordAnalyticsEvent({
    type: AnalyticsEventType.PROFILE_VIEW,
    actorUserId: input.actorUserId ?? null,
    businessProfileId: indexEntry.businessProfileId,
    citySlug: indexEntry.citySlug,
    categorySlug: indexEntry.categorySlugs[0] ?? null,
    metadata: { businessSlug: input.businessSlug }
  });
}

export async function trackContactClick(input: {
  businessSlug: string;
  actorUserId?: string | null;
  channel: "email" | "phone" | "whatsapp" | "lead_form";
  destination: string;
}) {
  const indexEntry = await prisma.businessSearchIndex.findFirst({
    where: { slug: input.businessSlug },
    select: {
      businessProfileId: true,
      citySlug: true,
      categorySlugs: true
    }
  });

  if (!indexEntry) {
    return null;
  }

  return recordAnalyticsEvent({
    type: AnalyticsEventType.CONTACT_CLICK,
    actorUserId: input.actorUserId ?? null,
    businessProfileId: indexEntry.businessProfileId,
    citySlug: indexEntry.citySlug,
    categorySlug: indexEntry.categorySlugs[0] ?? null,
    metadata: {
      businessSlug: input.businessSlug,
      channel: input.channel,
      destination: input.destination
    }
  });
}

async function syncPlatformDailyMetrics(day: Date) {
  const dayStart = startOfUtcDay(day);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const [
    newClientsCount,
    newBusinessesCount,
    verifiedActiveBusinessesCount,
    activeProfilesCount,
    profileViewsCount,
    contactClicksCount,
    leadsCreatedCount,
    respondedLeads,
    contactReleasedCount,
    openReportsCount,
    reviewModerations,
    activeSubscriptionsCount,
    activeBoostsCount,
    groupedSearches
  ] = await Promise.all([
    prisma.user.count({
      where: {
        role: UserRole.CLIENT,
        createdAt: { gte: dayStart, lt: dayEnd }
      }
    }),
    prisma.user.count({
      where: {
        role: UserRole.BUSINESS,
        createdAt: { gte: dayStart, lt: dayEnd }
      }
    }),
    prisma.businessProfile.count({
      where: {
        isPublished: true,
        createdAt: { lt: dayEnd },
        user: {
          verificationStatus: "APPROVED"
        }
      }
    }),
    prisma.businessProfile.count({
      where: {
        isPublished: true,
        createdAt: { lt: dayEnd }
      }
    }),
    prisma.analyticsEvent.count({
      where: {
        type: AnalyticsEventType.PROFILE_VIEW,
        occurredAt: { gte: dayStart, lt: dayEnd }
      }
    }),
    prisma.analyticsEvent.count({
      where: {
        type: AnalyticsEventType.CONTACT_CLICK,
        occurredAt: { gte: dayStart, lt: dayEnd }
      }
    }),
    prisma.analyticsEvent.count({
      where: {
        type: AnalyticsEventType.LEAD_CREATED,
        occurredAt: { gte: dayStart, lt: dayEnd }
      }
    }),
    prisma.lead.findMany({
      where: {
        respondedAt: { gte: dayStart, lt: dayEnd }
      },
      select: { createdAt: true, respondedAt: true }
    }),
    prisma.lead.count({
      where: {
        contactReleasedAt: { gte: dayStart, lt: dayEnd }
      }
    }),
    prisma.moderationCase.count({
      where: {
        status: "OPEN",
        createdAt: { lt: dayEnd }
      }
    }),
    prisma.reviewModeration.findMany({
      where: {
        reviewedAt: { gte: dayStart, lt: dayEnd }
      },
      select: { requestedAt: true, reviewedAt: true, status: true }
    }),
    prisma.subscription.count({
      where: {
        status: SubscriptionStatus.ACTIVE,
        OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gte: dayStart } }]
      }
    }),
    prisma.boost.count({
      where: {
        status: BoostStatus.ACTIVE,
        OR: [{ endsAt: null }, { endsAt: { gte: dayStart } }],
        createdAt: { lt: dayEnd }
      }
    }),
    prisma.searchSnapshot.groupBy({
      by: ["citySlug", "categorySlug"],
      where: {
        createdAt: { gte: dayStart, lt: dayEnd }
      },
      _count: { _all: true }
    })
  ]);

  const respondedLeadsCount = respondedLeads.length;
  const averageResponseHours = respondedLeads.length > 0
    ? round(
        respondedLeads.reduce((total, lead) => total + hoursBetween(lead.createdAt, lead.respondedAt ?? lead.createdAt), 0) /
          respondedLeads.length
      )
    : null;

  const approvedReviewsCount = reviewModerations.filter((item) => item.status === ReviewStatus.APPROVED).length;
  const rejectedReviewsCount = reviewModerations.filter((item) => item.status === ReviewStatus.REJECTED).length;
  const moreInfoReviewsCount = reviewModerations.filter((item) => item.status === ReviewStatus.MORE_INFO_REQUIRED).length;
  const averageReviewModerationHours = reviewModerations.length > 0
    ? round(
        reviewModerations.reduce((total, moderation) => {
          if (!moderation.reviewedAt) {
            return total;
          }

          return total + hoursBetween(moderation.requestedAt, moderation.reviewedAt);
        }, 0) / reviewModerations.length
      )
    : null;

  const topDemandByRegion = groupedSearches
    .filter((item) => item._count._all > 0)
    .sort((left, right) => right._count._all - left._count._all)
    .slice(0, 8)
    .map((item) => ({
      citySlug: item.citySlug,
      categorySlug: item.categorySlug,
      searchesCount: item._count._all
    }));

  await Promise.all([
    upsertDailyMetric({ metricDate: dayStart, scope: DailyMetricScope.PLATFORM, scopeKey: PLATFORM_SCOPE_KEY, metricKey: "new_clients", metricValue: newClientsCount }),
    upsertDailyMetric({ metricDate: dayStart, scope: DailyMetricScope.PLATFORM, scopeKey: PLATFORM_SCOPE_KEY, metricKey: "new_businesses", metricValue: newBusinessesCount }),
    upsertDailyMetric({ metricDate: dayStart, scope: DailyMetricScope.PLATFORM, scopeKey: PLATFORM_SCOPE_KEY, metricKey: "verified_active_businesses", metricValue: verifiedActiveBusinessesCount }),
    upsertDailyMetric({ metricDate: dayStart, scope: DailyMetricScope.PLATFORM, scopeKey: PLATFORM_SCOPE_KEY, metricKey: "active_profiles", metricValue: activeProfilesCount }),
    upsertDailyMetric({ metricDate: dayStart, scope: DailyMetricScope.PLATFORM, scopeKey: PLATFORM_SCOPE_KEY, metricKey: "profile_views", metricValue: profileViewsCount }),
    upsertDailyMetric({ metricDate: dayStart, scope: DailyMetricScope.PLATFORM, scopeKey: PLATFORM_SCOPE_KEY, metricKey: "contact_clicks", metricValue: contactClicksCount }),
    upsertDailyMetric({ metricDate: dayStart, scope: DailyMetricScope.PLATFORM, scopeKey: PLATFORM_SCOPE_KEY, metricKey: "leads_created", metricValue: leadsCreatedCount }),
    upsertDailyMetric({ metricDate: dayStart, scope: DailyMetricScope.PLATFORM, scopeKey: PLATFORM_SCOPE_KEY, metricKey: "leads_responded", metricValue: respondedLeadsCount }),
    upsertDailyMetric({ metricDate: dayStart, scope: DailyMetricScope.PLATFORM, scopeKey: PLATFORM_SCOPE_KEY, metricKey: "contact_released", metricValue: contactReleasedCount }),
    upsertDailyMetric({ metricDate: dayStart, scope: DailyMetricScope.PLATFORM, scopeKey: PLATFORM_SCOPE_KEY, metricKey: "open_reports", metricValue: openReportsCount }),
    upsertDailyMetric({ metricDate: dayStart, scope: DailyMetricScope.PLATFORM, scopeKey: PLATFORM_SCOPE_KEY, metricKey: "approved_reviews", metricValue: approvedReviewsCount }),
    upsertDailyMetric({ metricDate: dayStart, scope: DailyMetricScope.PLATFORM, scopeKey: PLATFORM_SCOPE_KEY, metricKey: "rejected_reviews", metricValue: rejectedReviewsCount }),
    upsertDailyMetric({ metricDate: dayStart, scope: DailyMetricScope.PLATFORM, scopeKey: PLATFORM_SCOPE_KEY, metricKey: "more_info_reviews", metricValue: moreInfoReviewsCount }),
    upsertDailyMetric({ metricDate: dayStart, scope: DailyMetricScope.PLATFORM, scopeKey: PLATFORM_SCOPE_KEY, metricKey: "average_response_hours", metricValue: averageResponseHours ?? 0 }),
    upsertDailyMetric({ metricDate: dayStart, scope: DailyMetricScope.PLATFORM, scopeKey: PLATFORM_SCOPE_KEY, metricKey: "average_review_moderation_hours", metricValue: averageReviewModerationHours ?? 0 }),
    upsertDailyMetric({ metricDate: dayStart, scope: DailyMetricScope.PLATFORM, scopeKey: PLATFORM_SCOPE_KEY, metricKey: "active_subscriptions", metricValue: activeSubscriptionsCount }),
    upsertDailyMetric({ metricDate: dayStart, scope: DailyMetricScope.PLATFORM, scopeKey: PLATFORM_SCOPE_KEY, metricKey: "active_boosts", metricValue: activeBoostsCount }),
    upsertDailyMetric({
      metricDate: dayStart,
      scope: DailyMetricScope.PLATFORM,
      scopeKey: PLATFORM_SCOPE_KEY,
      metricKey: "demand_by_region",
      metricValue: topDemandByRegion.reduce((total, item) => total + item.searchesCount, 0),
      metadata: { items: topDemandByRegion }
    })
  ]);
}

async function syncBusinessDailyMetrics(day: Date, businessProfileId: string) {
  const dayStart = startOfUtcDay(day);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const [
    profileViewsCount,
    contactClicksCount,
    leadsReceived,
    contactReleasedCount,
    approvedReviewsCount,
    averageRatingResult,
    trustScore,
    snapshot
  ] = await Promise.all([
    prisma.analyticsEvent.count({
      where: {
        type: AnalyticsEventType.PROFILE_VIEW,
        businessProfileId,
        occurredAt: { gte: dayStart, lt: dayEnd }
      }
    }),
    prisma.analyticsEvent.count({
      where: {
        type: AnalyticsEventType.CONTACT_CLICK,
        businessProfileId,
        occurredAt: { gte: dayStart, lt: dayEnd }
      }
    }),
    prisma.lead.findMany({
      where: {
        businessProfileId,
        createdAt: { gte: dayStart, lt: dayEnd }
      },
      select: { createdAt: true, respondedAt: true }
    }),
    prisma.lead.count({
      where: {
        businessProfileId,
        contactReleasedAt: { gte: dayStart, lt: dayEnd }
      }
    }),
    prisma.review.count({
      where: {
        businessProfileId,
        status: ReviewStatus.APPROVED,
        publishedAt: { gte: dayStart, lt: dayEnd }
      }
    }),
    prisma.review.aggregate({
      where: {
        businessProfileId,
        status: ReviewStatus.APPROVED,
        publishedAt: { lte: dayEnd }
      },
      _avg: { rating: true }
    }),
    prisma.trustScore.findUnique({
      where: { businessProfileId },
      select: { score: true }
    }),
    prisma.providerDashboardSnapshot.findFirst({
      where: {
        businessProfileId,
        snapshotDate: { lte: dayStart }
      },
      orderBy: { snapshotDate: "desc" },
      select: { trustScore: true }
    })
  ]);

  const respondedLeadsCount = leadsReceived.filter((lead) => Boolean(lead.respondedAt)).length;

  await Promise.all([
    upsertDailyMetric({ metricDate: dayStart, scope: DailyMetricScope.BUSINESS, scopeKey: businessProfileId, businessProfileId, metricKey: "profile_views", metricValue: profileViewsCount }),
    upsertDailyMetric({ metricDate: dayStart, scope: DailyMetricScope.BUSINESS, scopeKey: businessProfileId, businessProfileId, metricKey: "contact_clicks", metricValue: contactClicksCount }),
    upsertDailyMetric({ metricDate: dayStart, scope: DailyMetricScope.BUSINESS, scopeKey: businessProfileId, businessProfileId, metricKey: "leads_received", metricValue: leadsReceived.length }),
    upsertDailyMetric({ metricDate: dayStart, scope: DailyMetricScope.BUSINESS, scopeKey: businessProfileId, businessProfileId, metricKey: "leads_responded", metricValue: respondedLeadsCount }),
    upsertDailyMetric({ metricDate: dayStart, scope: DailyMetricScope.BUSINESS, scopeKey: businessProfileId, businessProfileId, metricKey: "contact_released", metricValue: contactReleasedCount }),
    upsertDailyMetric({ metricDate: dayStart, scope: DailyMetricScope.BUSINESS, scopeKey: businessProfileId, businessProfileId, metricKey: "approved_reviews", metricValue: approvedReviewsCount }),
    upsertDailyMetric({ metricDate: dayStart, scope: DailyMetricScope.BUSINESS, scopeKey: businessProfileId, businessProfileId, metricKey: "average_rating", metricValue: round(averageRatingResult._avg.rating) ?? 0 }),
    upsertDailyMetric({
      metricDate: dayStart,
      scope: DailyMetricScope.BUSINESS,
      scopeKey: businessProfileId,
      businessProfileId,
      metricKey: "trust_score",
      metricValue: snapshot?.trustScore ?? trustScore?.score ?? 0
    })
  ]);
}

async function ensurePlatformMetrics(range: AnalyticsDateRange) {
  for (const day of enumerateDays(range)) {
    await syncPlatformDailyMetrics(day);
  }
}

async function ensureBusinessMetrics(range: AnalyticsDateRange, businessProfileId: string) {
  for (const day of enumerateDays(range)) {
    await syncBusinessDailyMetrics(day, businessProfileId);
  }
}

async function syncBusinessReport(businessProfileId: string, range: AnalyticsDateRange) {
  const comparableBusinessIds = await getBusinessComparableIds(businessProfileId);
  const [
    profile,
    profileViewsCount,
    contactClicksCount,
    leads,
    approvedReviewsCount,
    averageRatingResult,
    pendingReviewsCount,
    rejectedReviewsCount,
    trustScore,
    trustScoreSnapshots,
    platformAverageRatingResult,
    platformLeadSet,
    activeBoostCount,
    subscription
  ] = await Promise.all([
    prisma.businessProfile.findUnique({ where: { id: businessProfileId }, select: { id: true, businessName: true } }),
    prisma.analyticsEvent.count({
      where: {
        type: AnalyticsEventType.PROFILE_VIEW,
        businessProfileId,
        occurredAt: { gte: range.start, lt: range.endExclusive }
      }
    }),
    prisma.analyticsEvent.count({
      where: {
        type: AnalyticsEventType.CONTACT_CLICK,
        businessProfileId,
        occurredAt: { gte: range.start, lt: range.endExclusive }
      }
    }),
    prisma.lead.findMany({
      where: {
        businessProfileId,
        createdAt: { gte: range.start, lt: range.endExclusive }
      },
      select: {
        createdAt: true,
        respondedAt: true,
        contactReleasedAt: true,
        subject: true,
        messagePreview: true,
        status: true
      }
    }),
    prisma.review.count({
      where: {
        businessProfileId,
        status: ReviewStatus.APPROVED,
        publishedAt: { gte: range.start, lt: range.endExclusive }
      }
    }),
    prisma.review.aggregate({
      where: {
        businessProfileId,
        status: ReviewStatus.APPROVED,
        publishedAt: { gte: range.start, lt: range.endExclusive }
      },
      _avg: { rating: true }
    }),
    prisma.review.count({
      where: {
        businessProfileId,
        status: { in: [ReviewStatus.PENDING, ReviewStatus.MORE_INFO_REQUIRED] }
      }
    }),
    prisma.review.count({
      where: {
        businessProfileId,
        status: ReviewStatus.REJECTED
      }
    }),
    prisma.trustScore.findUnique({
      where: { businessProfileId },
      select: { score: true }
    }),
    prisma.providerDashboardSnapshot.findMany({
      where: {
        businessProfileId,
        snapshotDate: { gte: range.start, lt: range.endExclusive }
      },
      select: { trustScore: true }
    }),
    prisma.review.aggregate({
      where: {
        businessProfileId: { in: comparableBusinessIds },
        status: ReviewStatus.APPROVED,
        publishedAt: { gte: range.start, lt: range.endExclusive }
      },
      _avg: { rating: true }
    }),
    prisma.lead.findMany({
      where: {
        businessProfileId: { in: comparableBusinessIds },
        createdAt: { gte: range.start, lt: range.endExclusive }
      },
      select: { respondedAt: true }
    }),
    prisma.boost.count({
      where: {
        businessProfileId,
        status: BoostStatus.ACTIVE,
        startsAt: { lt: range.endExclusive },
        OR: [{ endsAt: null }, { endsAt: { gte: range.start } }]
      }
    }),
    prisma.subscription.findUnique({ where: { businessProfileId }, select: { status: true } })
  ]);

  if (!profile) {
    throw new Error("BUSINESS_PROFILE_NOT_FOUND");
  }

  const respondedLeadsCount = leads.filter((lead) => Boolean(lead.respondedAt)).length;
  const responseRate = leads.length > 0 ? round((respondedLeadsCount / leads.length) * 100) ?? 0 : 0;
  const averageResponseHours = respondedLeadsCount > 0
    ? round(
        leads.filter((lead) => lead.respondedAt).reduce((total, lead) => total + hoursBetween(lead.createdAt, lead.respondedAt ?? lead.createdAt), 0) /
          respondedLeadsCount
      )
    : null;
  const trustScoreAverage = trustScoreSnapshots.length > 0
    ? round(trustScoreSnapshots.reduce((total, item) => total + item.trustScore, 0) / trustScoreSnapshots.length)
    : round(trustScore?.score);
  const platformAverageResponseRate = platformLeadSet.length > 0
    ? round((platformLeadSet.filter((lead) => Boolean(lead.respondedAt)).length / platformLeadSet.length) * 100)
    : null;
  const demandHighlights = extractDemandHighlights(leads.map((lead) => `${lead.subject} ${lead.messagePreview}`));

  const report = await prisma.businessReport.upsert({
    where: {
      businessProfileId_periodStart_periodEnd: {
        businessProfileId,
        periodStart: range.start,
        periodEnd: range.endInclusive
      }
    },
    update: {
      profileViewsCount,
      contactClicksCount,
      leadsReceivedCount: leads.length,
      respondedLeadsCount,
      responseRate,
      averageResponseHours,
      trustScoreLatest: trustScore?.score ?? 0,
      trustScoreAverage,
      approvedReviewsCount,
      averageRating: round(averageRatingResult._avg.rating),
      platformAverageRating: round(platformAverageRatingResult._avg.rating),
      platformAverageResponseRate,
      activeBoostCount,
      demandHighlights
    },
    create: {
      businessProfileId,
      periodStart: range.start,
      periodEnd: range.endInclusive,
      profileViewsCount,
      contactClicksCount,
      leadsReceivedCount: leads.length,
      respondedLeadsCount,
      responseRate,
      averageResponseHours,
      trustScoreLatest: trustScore?.score ?? 0,
      trustScoreAverage,
      approvedReviewsCount,
      averageRating: round(averageRatingResult._avg.rating),
      platformAverageRating: round(platformAverageRatingResult._avg.rating),
      platformAverageResponseRate,
      activeBoostCount,
      demandHighlights
    }
  });

  return {
    profile,
    report,
    pendingReviewsCount,
    rejectedReviewsCount,
    subscriptionStatus: subscription?.status?.toLowerCase() ?? "not_enabled"
  };
}

export async function getAdminAnalyticsOverview(input: AnalyticsDateRangeInput = {}): Promise<AdminAnalyticsOverview> {
  const range = resolveAnalyticsDateRange(input);
  await ensurePlatformMetrics(range);

  const metrics = await prisma.dailyMetric.findMany({
    where: {
      scope: DailyMetricScope.PLATFORM,
      scopeKey: PLATFORM_SCOPE_KEY,
      metricDate: { gte: range.start, lt: range.endExclusive }
    },
    orderBy: { metricDate: "asc" }
  });

  const metricsByKey = metricMap(metrics);
  const days = enumerateDays(range);
  const latestMetricDate = days.at(-1) ?? range.start;
  const demandMetric = metricsByKey.get(`${formatDay(latestMetricDate)}:demand_by_region`);
  const demandItems = Array.isArray((demandMetric?.metadata as { items?: unknown })?.items)
    ? ((demandMetric?.metadata as { items: Array<{ citySlug: string | null; categorySlug: string | null; searchesCount: number }> }).items)
    : [];

  return {
    periodStart: range.start.toISOString(),
    periodEnd: range.endInclusive.toISOString(),
    totals: {
      newClientsCount: sumMetricValues(metrics.filter((metric) => metric.metricKey === "new_clients")),
      newBusinessesCount: sumMetricValues(metrics.filter((metric) => metric.metricKey === "new_businesses")),
      verifiedActiveBusinessesCount: getMetricValue(metricsByKey, latestMetricDate, "verified_active_businesses"),
      activeProfilesCount: getMetricValue(metricsByKey, latestMetricDate, "active_profiles"),
      profileViewsCount: sumMetricValues(metrics.filter((metric) => metric.metricKey === "profile_views")),
      contactClicksCount: sumMetricValues(metrics.filter((metric) => metric.metricKey === "contact_clicks")),
      leadsCreatedCount: sumMetricValues(metrics.filter((metric) => metric.metricKey === "leads_created")),
      respondedLeadsCount: sumMetricValues(metrics.filter((metric) => metric.metricKey === "leads_responded")),
      averageResponseHours: averageMetricValue(metrics.filter((metric) => metric.metricKey === "average_response_hours"), (metric) => metric.metricValue > 0),
      openReportsCount: getMetricValue(metricsByKey, latestMetricDate, "open_reports"),
      reportsRatePercent:
        round(
          getMetricValue(metricsByKey, latestMetricDate, "active_profiles") > 0
            ? (getMetricValue(metricsByKey, latestMetricDate, "open_reports") /
                getMetricValue(metricsByKey, latestMetricDate, "active_profiles")) * 100
            : 0
        ) ?? 0,
      approvedReviewsCount: sumMetricValues(metrics.filter((metric) => metric.metricKey === "approved_reviews")),
      rejectedReviewsCount: sumMetricValues(metrics.filter((metric) => metric.metricKey === "rejected_reviews")),
      moreInfoReviewsCount: sumMetricValues(metrics.filter((metric) => metric.metricKey === "more_info_reviews")),
      averageReviewModerationHours: averageMetricValue(metrics.filter((metric) => metric.metricKey === "average_review_moderation_hours"), (metric) => metric.metricValue > 0),
      activeSubscriptionsCount: getMetricValue(metricsByKey, latestMetricDate, "active_subscriptions"),
      activeBoostsCount: getMetricValue(metricsByKey, latestMetricDate, "active_boosts")
    },
    series: days.map((day) => ({
      date: formatDay(day),
      newClientsCount: getMetricValue(metricsByKey, day, "new_clients"),
      newBusinessesCount: getMetricValue(metricsByKey, day, "new_businesses"),
      profileViewsCount: getMetricValue(metricsByKey, day, "profile_views"),
      contactClicksCount: getMetricValue(metricsByKey, day, "contact_clicks"),
      leadsCreatedCount: getMetricValue(metricsByKey, day, "leads_created"),
      approvedReviewsCount: getMetricValue(metricsByKey, day, "approved_reviews")
    })),
    topDemandByRegion: demandItems
  };
}

export async function getAdminAnalyticsFunnels(input: AnalyticsDateRangeInput = {}): Promise<AdminAnalyticsFunnel> {
  const range = resolveAnalyticsDateRange(input);
  const [profileViewsCount, contactClicksCount, leadsCreatedCount] = await Promise.all([
    prisma.analyticsEvent.count({
      where: {
        type: AnalyticsEventType.PROFILE_VIEW,
        occurredAt: { gte: range.start, lt: range.endExclusive }
      }
    }),
    prisma.analyticsEvent.count({
      where: {
        type: AnalyticsEventType.CONTACT_CLICK,
        occurredAt: { gte: range.start, lt: range.endExclusive }
      }
    }),
    prisma.analyticsEvent.count({
      where: {
        type: AnalyticsEventType.LEAD_CREATED,
        occurredAt: { gte: range.start, lt: range.endExclusive }
      }
    })
  ]);

  const steps = [
    { code: "profile_view", label: "Profile views", count: profileViewsCount },
    { code: "contact_click", label: "Contact clicks", count: contactClicksCount },
    { code: "lead_created", label: "Leads sent", count: leadsCreatedCount }
  ].map((step, index, source) => ({
    ...step,
    conversionFromPrevious: index === 0 || source[index - 1].count === 0 ? null : round((step.count / source[index - 1].count) * 100),
    conversionFromFirst: index === 0 || source[0].count === 0 ? null : round((step.count / source[0].count) * 100)
  }));

  return {
    periodStart: range.start.toISOString(),
    periodEnd: range.endInclusive.toISOString(),
    steps
  };
}

export async function getBusinessAnalyticsOverview(businessUserId: string, input: AnalyticsDateRangeInput = {}): Promise<BusinessAnalyticsOverview> {
  const range = resolveAnalyticsDateRange(input);
  const businessProfile = await getBusinessProfileByUserId(businessUserId);
  await ensureBusinessMetrics(range, businessProfile.id);
  const synced = await syncBusinessReport(businessProfile.id, range);

  const metrics = await prisma.dailyMetric.findMany({
    where: {
      scope: DailyMetricScope.BUSINESS,
      scopeKey: businessProfile.id,
      metricDate: { gte: range.start, lt: range.endExclusive }
    },
    orderBy: { metricDate: "asc" }
  });

  const metricsByKey = metricMap(metrics);

  return {
    periodStart: range.start.toISOString(),
    periodEnd: range.endInclusive.toISOString(),
    businessProfileId: businessProfile.id,
    businessName: businessProfile.businessName,
    summary: {
      profileViewsCount: synced.report.profileViewsCount,
      contactClicksCount: synced.report.contactClicksCount,
      leadsReceivedCount: synced.report.leadsReceivedCount,
      respondedLeadsCount: synced.report.respondedLeadsCount,
      responseRate: round(synced.report.responseRate) ?? 0,
      averageResponseHours: round(synced.report.averageResponseHours),
      trustScoreLatest: synced.report.trustScoreLatest,
      trustScoreAverage: round(synced.report.trustScoreAverage),
      approvedReviewsCount: synced.report.approvedReviewsCount,
      averageRating: round(synced.report.averageRating),
      platformAverageRating: round(synced.report.platformAverageRating),
      platformAverageResponseRate: round(synced.report.platformAverageResponseRate),
      activeBoostCount: synced.report.activeBoostCount,
      demandHighlights: synced.report.demandHighlights,
      subscriptionStatus: synced.subscriptionStatus
    },
    daily: enumerateDays(range).map((day) => ({
      date: formatDay(day),
      profileViewsCount: getMetricValue(metricsByKey, day, "profile_views"),
      contactClicksCount: getMetricValue(metricsByKey, day, "contact_clicks"),
      leadsReceivedCount: getMetricValue(metricsByKey, day, "leads_received"),
      respondedLeadsCount: getMetricValue(metricsByKey, day, "leads_responded"),
      approvedReviewsCount: getMetricValue(metricsByKey, day, "approved_reviews"),
      trustScore: getMetricValue(metricsByKey, day, "trust_score")
    }))
  };
}

export async function getBusinessAnalyticsLeads(businessUserId: string, input: AnalyticsDateRangeInput = {}): Promise<BusinessAnalyticsLeads> {
  const range = resolveAnalyticsDateRange(input);
  const businessProfile = await getBusinessProfileByUserId(businessUserId);
  await ensureBusinessMetrics(range, businessProfile.id);

  const [dailyMetrics, leads] = await Promise.all([
    prisma.dailyMetric.findMany({
      where: {
        scope: DailyMetricScope.BUSINESS,
        scopeKey: businessProfile.id,
        metricDate: { gte: range.start, lt: range.endExclusive },
        metricKey: { in: ["leads_received", "leads_responded", "contact_released"] }
      },
      orderBy: { metricDate: "asc" }
    }),
    prisma.lead.findMany({
      where: {
        businessProfileId: businessProfile.id,
        createdAt: { gte: range.start, lt: range.endExclusive }
      },
      select: {
        createdAt: true,
        respondedAt: true,
        contactReleasedAt: true,
        subject: true,
        messagePreview: true,
        status: true
      }
    })
  ]);

  const metricsByKey = metricMap(dailyMetrics);
  const respondedLeads = leads.filter((lead) => Boolean(lead.respondedAt));
  const responseRate = leads.length > 0 ? round((respondedLeads.length / leads.length) * 100) ?? 0 : 0;
  const averageResponseHours = respondedLeads.length > 0
    ? round(
        respondedLeads.reduce((total, lead) => total + hoursBetween(lead.createdAt, lead.respondedAt ?? lead.createdAt), 0) /
          respondedLeads.length
      )
    : null;
  const highlights = extractDemandHighlights(leads.map((lead) => `${lead.subject} ${lead.messagePreview}`));

  return {
    periodStart: range.start.toISOString(),
    periodEnd: range.endInclusive.toISOString(),
    businessProfileId: businessProfile.id,
    totals: {
      leadsReceivedCount: leads.length,
      respondedLeadsCount: respondedLeads.length,
      openLeadsCount: leads.filter((lead) => !lead.respondedAt && lead.status !== "CLOSED").length,
      contactReleasedCount: leads.filter((lead) => Boolean(lead.contactReleasedAt)).length,
      responseRate,
      averageResponseHours
    },
    daily: enumerateDays(range).map((day) => ({
      date: formatDay(day),
      leadsReceivedCount: getMetricValue(metricsByKey, day, "leads_received"),
      respondedLeadsCount: getMetricValue(metricsByKey, day, "leads_responded"),
      contactReleasedCount: getMetricValue(metricsByKey, day, "contact_released")
    })),
    topSubjects: highlights.map((term) => ({
      term,
      count: leads.filter((lead) => `${lead.subject} ${lead.messagePreview}`.toLowerCase().includes(term)).length
    }))
  };
}

export async function getBusinessAnalyticsReputation(businessUserId: string, input: AnalyticsDateRangeInput = {}): Promise<BusinessAnalyticsReputation> {
  const range = resolveAnalyticsDateRange(input);
  const businessProfile = await getBusinessProfileByUserId(businessUserId);
  await ensureBusinessMetrics(range, businessProfile.id);
  const synced = await syncBusinessReport(businessProfile.id, range);

  const dailyMetrics = await prisma.dailyMetric.findMany({
    where: {
      scope: DailyMetricScope.BUSINESS,
      scopeKey: businessProfile.id,
      metricDate: { gte: range.start, lt: range.endExclusive },
      metricKey: { in: ["approved_reviews", "average_rating", "trust_score"] }
    },
    orderBy: { metricDate: "asc" }
  });

  const metricsByKey = metricMap(dailyMetrics);

  return {
    periodStart: range.start.toISOString(),
    periodEnd: range.endInclusive.toISOString(),
    businessProfileId: businessProfile.id,
    summary: {
      trustScoreLatest: synced.report.trustScoreLatest,
      trustScoreAverage: round(synced.report.trustScoreAverage),
      approvedReviewsCount: synced.report.approvedReviewsCount,
      pendingReviewsCount: synced.pendingReviewsCount,
      rejectedReviewsCount: synced.rejectedReviewsCount,
      averageRating: round(synced.report.averageRating),
      platformAverageRating: round(synced.report.platformAverageRating)
    },
    daily: enumerateDays(range).map((day) => ({
      date: formatDay(day),
      trustScore: getMetricValue(metricsByKey, day, "trust_score"),
      approvedReviewsCount: getMetricValue(metricsByKey, day, "approved_reviews"),
      averageRating: round(getMetricValue(metricsByKey, day, "average_rating"))
    }))
  };
}

export async function exportBusinessAnalyticsReport(businessUserId: string, input: AnalyticsDateRangeInput = {}): Promise<BusinessAnalyticsExport> {
  const [overview, leads, reputation] = await Promise.all([
    getBusinessAnalyticsOverview(businessUserId, input),
    getBusinessAnalyticsLeads(businessUserId, input),
    getBusinessAnalyticsReputation(businessUserId, input)
  ]);

  const lines = [
    ["section", "metric", "value"],
    ["overview", "business_name", overview.businessName],
    ["overview", "profile_views", overview.summary.profileViewsCount],
    ["overview", "contact_clicks", overview.summary.contactClicksCount],
    ["overview", "leads_received", overview.summary.leadsReceivedCount],
    ["overview", "responded_leads", overview.summary.respondedLeadsCount],
    ["overview", "response_rate", overview.summary.responseRate],
    ["overview", "average_response_hours", overview.summary.averageResponseHours],
    ["overview", "trust_score_latest", overview.summary.trustScoreLatest],
    ["overview", "trust_score_average", overview.summary.trustScoreAverage],
    ["overview", "approved_reviews", overview.summary.approvedReviewsCount],
    ["overview", "average_rating", overview.summary.averageRating],
    ["overview", "platform_average_rating", overview.summary.platformAverageRating],
    ["overview", "platform_average_response_rate", overview.summary.platformAverageResponseRate],
    ["overview", "active_boost_count", overview.summary.activeBoostCount],
    ["overview", "subscription_status", overview.summary.subscriptionStatus],
    ["overview", "demand_highlights", overview.summary.demandHighlights.join("|")],
    ["leads", "open_leads_count", leads.totals.openLeadsCount],
    ["leads", "contact_released_count", leads.totals.contactReleasedCount],
    ["reputation", "pending_reviews_count", reputation.summary.pendingReviewsCount],
    ["reputation", "rejected_reviews_count", reputation.summary.rejectedReviewsCount]
  ];

  const csv = `${lines.map((line) => line.map((value) => escapeCsv(value as string | number | null)).join(",")).join("\n")}\n`;
  const filename = `business-report-${overview.businessProfileId}-${overview.periodStart.slice(0, 10)}-${overview.periodEnd.slice(0, 10)}.csv`;

  return {
    filename,
    contentType: "text/csv; charset=utf-8",
    csv
  };
}
