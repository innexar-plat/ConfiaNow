import "dotenv/config";
import { PageStatus, PageType, Prisma } from "@prisma/client";
import { prisma } from "@platform/database";

// ── Types ──────────────────────────────────────────────────────────────────

export type PageSectionInput = {
  type: string;
  order?: number;
  title?: string | null;
  body?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type CreatePageInput = {
  slug: string;
  type?: PageType;
  title: string;
  description?: string | null;
  ogImage?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  entitySlug?: string | null;
  authorId?: string | null;
  publishedAt?: Date | null;
  sections?: PageSectionInput[];
};

export type UpdatePageInput = Partial<Omit<CreatePageInput, "slug">> & {
  status?: PageStatus;
};

export type AdminPagesQuery = {
  page?: number;
  limit?: number;
  type?: PageType;
  status?: PageStatus;
};

export type CampaignAttributionInput = {
  userId: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  landingPage?: string | null;
  referrer?: string | null;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function assertFound<T>(value: T | null | undefined, error: string): T {
  if (value == null) throw new Error(error);
  return value;
}

// ── Public page resolution ─────────────────────────────────────────────────

export async function getPageBySlug(slug: string) {
  const page = await prisma.page.findUnique({
    where: { slug },
    include: {
      sections: { orderBy: { order: "asc" } },
      author: { select: { id: true, displayName: true } }
    }
  });

  assertFound(page, "PAGE_NOT_FOUND");

  if (page!.status !== PageStatus.PUBLISHED) {
    throw new Error("PAGE_NOT_PUBLISHED");
  }

  return page!;
}

// ── SEO metadata per entity ────────────────────────────────────────────────

export async function getCitySeoData(citySlug: string) {
  const seo = await prisma.seoMetadata.findUnique({
    where: { entityType_entitySlug: { entityType: "city", entitySlug: citySlug } }
  });

  if (seo) return seo;

  // Fallback: derive from published businesses in that city
  const count = await prisma.businessSearchIndex.count({
    where: { citySlug: { equals: citySlug, mode: "insensitive" }, isPublished: true }
  });

  return {
    entityType: "city",
    entitySlug: citySlug,
    title: `Profissionais verificados em ${citySlug}`,
    description: `Encontre ${count} profissional(is) verificado(s) em ${citySlug}. Avaliações reais e histórico comprovado.`,
    ogImage: null,
    canonicalUrl: null,
    structuredData: null
  };
}

export async function getCategorySeoData(categorySlug: string) {
  const seo = await prisma.seoMetadata.findUnique({
    where: { entityType_entitySlug: { entityType: "category", entitySlug: categorySlug } }
  });

  if (seo) return seo;

  // Fallback: derive from published businesses with that category
  const count = await prisma.businessSearchIndex.count({
    where: { categorySlugs: { has: categorySlug }, isPublished: true }
  });

  return {
    entityType: "category",
    entitySlug: categorySlug,
    title: `Profissionais verificados — ${categorySlug}`,
    description: `Encontre ${count} profissional(is) verificado(s) em ${categorySlug}. Compare avaliações e histórico comprovado.`,
    ogImage: null,
    canonicalUrl: null,
    structuredData: null
  };
}

// ── City page businesses ───────────────────────────────────────────────────

export async function getCityPageBusinesses(citySlug: string, limit = 20) {
  return prisma.businessSearchIndex.findMany({
    where: { citySlug: { equals: citySlug, mode: "insensitive" }, isPublished: true },
    orderBy: [{ rankingScore: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      slug: true,
      businessName: true,
      headline: true,
      cityName: true,
      stateCode: true,
      trustScore: true,
      categorySlugs: true
    }
  });
}

export async function getCategoryPageBusinesses(categorySlug: string, limit = 20) {
  return prisma.businessSearchIndex.findMany({
    where: { categorySlugs: { has: categorySlug }, isPublished: true },
    orderBy: [{ rankingScore: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      slug: true,
      businessName: true,
      headline: true,
      cityName: true,
      stateCode: true,
      trustScore: true,
      categorySlugs: true
    }
  });
}

// ── Admin pages CRUD ───────────────────────────────────────────────────────

export async function listAdminPages(query: AdminPagesQuery) {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where = {
    ...(query.type ? { type: query.type } : {}),
    ...(query.status ? { status: query.status } : {})
  };

  const [items, total] = await prisma.$transaction([
    prisma.page.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        type: true,
        status: true,
        title: true,
        publishedAt: true,
        createdAt: true,
        author: { select: { id: true, displayName: true } }
      }
    }),
    prisma.page.count({ where })
  ]);

  return {
    data: items,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
}

export async function createPage(input: CreatePageInput) {
  const { sections, ...pageData } = input;

  const existing = await prisma.page.findUnique({ where: { slug: input.slug } });
  if (existing) throw new Error("PAGE_SLUG_CONFLICT");

  return prisma.page.create({
    data: {
      ...pageData,
      status: PageStatus.DRAFT,
      sections: sections
        ? {
            create: sections.map((s, i) => ({
              type: s.type,
              order: s.order ?? i,
              title: s.title ?? undefined,
              body: s.body ?? undefined,
              metadata: (s.metadata === null ? Prisma.JsonNull : (s.metadata ?? undefined)) as Prisma.InputJsonValue
            }))
          }
        : undefined
    },
    include: { sections: { orderBy: { order: "asc" } } }
  });
}

function buildUpdateData(args: {
  pageData: Omit<UpdatePageInput, "sections" | "authorId">;
  authorId: string | null | undefined;
  sections: PageSectionInput[] | undefined;
  page: { publishedAt: Date | null };
}): Prisma.PageUncheckedUpdateInput {
  const { pageData, authorId, sections, page } = args;
  const data: Prisma.PageUncheckedUpdateInput = { ...pageData };

  if (authorId !== undefined) data.authorId = authorId ?? undefined;
  if (pageData.status === PageStatus.PUBLISHED && !page.publishedAt) {
    data.publishedAt = new Date();
  }
  if (sections !== undefined) {
    data.sections = {
      deleteMany: {},
      create: sections.map((s, i) => ({
        type: s.type,
        order: s.order ?? i,
        title: s.title ?? undefined,
        body: s.body ?? undefined,
        metadata: (s.metadata === null ? Prisma.JsonNull : (s.metadata ?? undefined)) as Prisma.InputJsonValue
      }))
    };
  }
  return data;
}

export async function updatePage(id: string, input: UpdatePageInput) {
  const page = await prisma.page.findUnique({ where: { id } });
  assertFound(page, "PAGE_NOT_FOUND");

  const { sections, authorId, ...pageData } = input;

  return prisma.page.update({
    where: { id },
    data: buildUpdateData({ pageData, authorId, sections, page: page! }),
    include: { sections: { orderBy: { order: "asc" } } }
  });
}

export async function deletePage(id: string) {
  const page = await prisma.page.findUnique({ where: { id } });
  assertFound(page, "PAGE_NOT_FOUND");

  await prisma.page.update({
    where: { id },
    data: { status: PageStatus.ARCHIVED }
  });

  return { success: true };
}

// ── Campaign attribution ────────────────────────────────────────────────────

export async function recordCampaignAttribution(input: CampaignAttributionInput) {
  return prisma.campaignAttribution.create({ data: input });
}
