import { VerificationStatus } from "@prisma/client";
import { prisma } from "@platform/database";
import { computeDiscoveryScore, normalizeDiscoverySlug } from "./scoring";

const ACTIVE_BOOST_RANKING_BONUS = 40;

export type BusinessSearchCard = {
  id: string;
  slug: string;
  businessName: string;
  headline: string | null;
  city: string | null;
  stateCode: string | null;
  categories: string[];
  rankingScore: number;
  trustScore: number;
  trustBadge: string;
};

export type CategoryView = {
  id: string;
  slug: string;
  name: string;
  businessCount: number;
};

export type CityView = {
  id: string;
  slug: string;
  name: string;
  stateCode: string;
  businessCount: number;
};

export { computeDiscoveryScore, normalizeDiscoverySlug } from "./scoring";

function humanizeSlug(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}


function mapSearchCard(entry: {
  businessProfileId: string;
  slug: string;
  businessName: string;
  headline: string | null;
  cityName: string | null;
  stateCode: string | null;
  categorySlugs: string[];
  rankingScore: number;
  trustScore: number;
  trustBadge: string;
}): BusinessSearchCard {
  return {
    id: entry.businessProfileId,
    slug: entry.slug,
    businessName: entry.businessName,
    headline: entry.headline,
    city: entry.cityName,
    stateCode: entry.stateCode,
    categories: entry.categorySlugs,
    rankingScore: entry.rankingScore,
    trustScore: entry.trustScore,
    trustBadge: entry.trustBadge.toLowerCase()
  };
}

async function applyBoostBonus(entries: Array<{
  businessProfileId: string;
  slug: string;
  businessName: string;
  headline: string | null;
  cityName: string | null;
  stateCode: string | null;
  categorySlugs: string[];
  rankingScore: number;
  trustScore: number;
  trustBadge: string;
}>) {
  if (entries.length === 0) {
    return [] as BusinessSearchCard[];
  }

  const activeBoosts = await prisma.boost.groupBy({
    by: ["businessProfileId"],
    where: {
      businessProfileId: { in: entries.map((entry) => entry.businessProfileId) },
      status: "ACTIVE",
      OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }]
    },
    _count: { businessProfileId: true }
  });

  const counts = new Map(activeBoosts.map((item) => [item.businessProfileId, item._count.businessProfileId]));

  return entries.map((entry) => {
    const boostCount = counts.get(entry.businessProfileId) ?? 0;
    return mapSearchCard({
      ...entry,
      rankingScore: entry.rankingScore + (boostCount * ACTIVE_BOOST_RANKING_BONUS)
    });
  });
}

async function ensureDiscoveryReferenceData(city?: string | null, stateCode?: string | null, categorySlugs: string[] = []) {
  if (city && stateCode) {
    await prisma.city.upsert({
      where: { slug: normalizeDiscoverySlug(city) },
      update: { name: city, stateCode, isActive: true },
      create: {
        slug: normalizeDiscoverySlug(city),
        name: city,
        stateCode,
        isActive: true
      }
    });
  }

  for (const categorySlug of categorySlugs) {
    await prisma.category.upsert({
      where: { slug: categorySlug },
      update: { name: humanizeSlug(categorySlug), isActive: true },
      create: {
        slug: categorySlug,
        name: humanizeSlug(categorySlug),
        isActive: true
      }
    });
  }
}

export async function syncBusinessSearchIndex(businessProfileId: string) {
  const profile = await prisma.businessProfile.findUnique({
    where: { id: businessProfileId },
    include: {
      user: { select: { verificationStatus: true } },
      categories: { orderBy: { displayOrder: "asc" } },
      services: { select: { id: true } },
      portfolioItems: { select: { id: true } },
      trustScore: { include: { badgeLevel: true } }
    }
  });

  if (!profile) {
    throw new Error("BUSINESS_PROFILE_NOT_FOUND");
  }

  const categorySlugs = profile.categories.map((category) => category.name);
  const citySlug = profile.city ? normalizeDiscoverySlug(profile.city) : null;
  const rankingScore = computeDiscoveryScore({
    isPublished: profile.isPublished,
    verificationStatus: profile.user.verificationStatus,
    headline: profile.headline,
    description: profile.description,
    categoriesCount: profile.categories.length,
    servicesCount: profile.services.length,
    portfolioCount: profile.portfolioItems.length,
    yearsInBusiness: profile.yearsInBusiness,
    city: profile.city,
    trustScore: profile.trustScore?.score ?? 0
  });

  await ensureDiscoveryReferenceData(profile.city, profile.state, categorySlugs);

  const entry = await prisma.businessSearchIndex.upsert({
    where: { businessProfileId },
    update: {
      slug: profile.slug,
      businessName: profile.businessName,
      headline: profile.headline,
      description: profile.description,
      citySlug,
      cityName: profile.city,
      stateCode: profile.state,
      categorySlugs,
      searchText: [
        profile.businessName,
        profile.headline,
        profile.description,
        profile.city,
        profile.state,
        ...categorySlugs
      ].filter(Boolean).join(" ").toLowerCase(),
      rankingScore,
      trustScore: profile.trustScore?.score ?? 0,
      trustBadge: profile.trustScore?.badgeLevel?.code ?? "NONE",
      isPublished: profile.isPublished,
      verificationStatus: profile.user.verificationStatus
    },
    create: {
      businessProfileId,
      slug: profile.slug,
      businessName: profile.businessName,
      headline: profile.headline,
      description: profile.description,
      citySlug,
      cityName: profile.city,
      stateCode: profile.state,
      categorySlugs,
      searchText: [
        profile.businessName,
        profile.headline,
        profile.description,
        profile.city,
        profile.state,
        ...categorySlugs
      ].filter(Boolean).join(" ").toLowerCase(),
      rankingScore,
      trustScore: profile.trustScore?.score ?? 0,
      trustBadge: profile.trustScore?.badgeLevel?.code ?? "NONE",
      isPublished: profile.isPublished,
      verificationStatus: profile.user.verificationStatus
    }
  });

  return mapSearchCard(entry);
}

export async function recordSearchSnapshot(input: { query?: string; categorySlug?: string; citySlug?: string; resultsCount: number }) {
  return prisma.searchSnapshot.create({
    data: {
      query: input.query || null,
      categorySlug: input.categorySlug || null,
      citySlug: input.citySlug || null,
      resultsCount: input.resultsCount
    }
  });
}

export async function searchBusinesses(input: {
  query?: string;
  category?: string;
  city?: string;
  sortBy?: "relevance" | "name" | "city";
}) {
  const query = input.query?.trim().toLowerCase();
  const category = input.category ? normalizeDiscoverySlug(input.category) : undefined;
  const city = input.city ? normalizeDiscoverySlug(input.city) : undefined;

  const where = {
    isPublished: true,
    ...(query ? { searchText: { contains: query } } : {}),
    ...(category ? { categorySlugs: { has: category } } : {}),
    ...(city ? { citySlug: city } : {})
  };

  const orderBy = input.sortBy === "name"
    ? [{ businessName: "asc" as const }]
    : input.sortBy === "city"
      ? [{ cityName: "asc" as const }, { rankingScore: "desc" as const }]
      : [{ rankingScore: "desc" as const }, { updatedAt: "desc" as const }];

  const entries = await prisma.businessSearchIndex.findMany({
    where,
    orderBy,
    take: input.sortBy === "relevance" || !input.sortBy ? 48 : 24
  });

  const rankedEntries = await applyBoostBonus(entries);
  const results = input.sortBy === "relevance" || !input.sortBy
    ? rankedEntries.sort((left, right) => right.rankingScore - left.rankingScore).slice(0, 24)
    : rankedEntries.slice(0, 24);

  await recordSearchSnapshot({
    query,
    categorySlug: category,
    citySlug: city,
    resultsCount: results.length
  });

  return results;
}

export async function getSearchSuggestions(query: string) {
  const term = query.trim().toLowerCase();

  if (!term) {
    return { businesses: [], categories: [], cities: [] };
  }

  const [businesses, categories, cities] = await Promise.all([
    prisma.businessSearchIndex.findMany({
      where: { isPublished: true, searchText: { contains: term } },
      orderBy: [{ rankingScore: "desc" }, { businessName: "asc" }],
      take: 5
    }),
    prisma.category.findMany({
      where: { isActive: true, OR: [{ slug: { contains: term } }, { name: { contains: query, mode: "insensitive" } }] },
      orderBy: { name: "asc" },
      take: 5
    }),
    prisma.city.findMany({
      where: { isActive: true, OR: [{ slug: { contains: term } }, { name: { contains: query, mode: "insensitive" } }] },
      orderBy: { name: "asc" },
      take: 5
    })
  ]);

  return {
    businesses: businesses.map(mapSearchCard),
    categories: categories.map((category) => ({ slug: category.slug, name: category.name })),
    cities: cities.map((city) => ({ slug: city.slug, name: city.name, stateCode: city.stateCode }))
  };
}

export async function listCategories() {
  const categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });

  return Promise.all(categories.map(async (category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    businessCount: await prisma.businessSearchIndex.count({ where: { isPublished: true, categorySlugs: { has: category.slug } } })
  })));
}

export async function getCategoryDiscovery(slug: string) {
  const normalizedSlug = normalizeDiscoverySlug(slug);
  const category = await prisma.category.findUnique({ where: { slug: normalizedSlug } });

  if (!category) {
    throw new Error("CATEGORY_NOT_FOUND");
  }

  const businesses = await searchBusinesses({ category: normalizedSlug });
  return {
    category: {
      id: category.id,
      slug: category.slug,
      name: category.name,
      businessCount: businesses.length
    },
    businesses
  };
}

export async function listCities() {
  const cities = await prisma.city.findMany({ where: { isActive: true }, orderBy: [{ stateCode: "asc" }, { name: "asc" }] });

  return Promise.all(cities.map(async (city) => ({
    id: city.id,
    slug: city.slug,
    name: city.name,
    stateCode: city.stateCode,
    businessCount: await prisma.businessSearchIndex.count({ where: { isPublished: true, citySlug: city.slug } })
  })));
}

export async function getTrendingDiscovery() {
  const [categories, cities] = await Promise.all([listCategories(), listCities()]);

  return {
    categories: categories.sort((left, right) => right.businessCount - left.businessCount).slice(0, 6),
    cities: cities.sort((left, right) => right.businessCount - left.businessCount).slice(0, 6)
  };
}

export async function getTopRatedDiscovery() {
  const entries = await prisma.businessSearchIndex.findMany({
    where: { isPublished: true },
    orderBy: [{ rankingScore: "desc" }, { updatedAt: "desc" }],
    take: 16
  });

  return (await applyBoostBonus(entries)).sort((left, right) => right.rankingScore - left.rankingScore).slice(0, 8);
}