import { UserRole } from "@prisma/client";
import { prisma } from "@platform/database";
import { syncBusinessSearchIndex } from "@platform/discovery";
import { recalculateBusinessTrustScore } from "@platform/trust";
import { normalizeSlug } from "./slug";

export type TrustSnapshotView = {
  score: number;
  badgeCode: string;
  badgeLabel: string;
  isSuspended: boolean;
  suspensionReason: string | null;
  lastCalculatedAt: string | null;
};

export type PublicBusinessProfile = {
  id: string;
  slug: string;
  businessName: string;
  isPublished: boolean;
  headline: string | null;
  description: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
  whatsapp: string | null;
  websiteUrl: string | null;
  city: string | null;
  state: string | null;
  serviceArea: string | null;
  yearsInBusiness: number | null;
  categories: Array<{ id: string; name: string; displayOrder: number }>;
  trust: TrustSnapshotView | null;
};

export type BusinessServiceView = {
  id: string;
  title: string;
  description: string | null;
  priceLabel: string | null;
  displayOrder: number;
};

export type PortfolioItemView = {
  id: string;
  title: string;
  description: string | null;
  mediaUrl: string | null;
  displayOrder: number;
};

export { normalizeSlug } from "./slug";

function mapProfile(profile: {
  id: string;
  slug: string;
  businessName: string;
  isPublished: boolean;
  headline: string | null;
  description: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
  whatsapp: string | null;
  websiteUrl: string | null;
  city: string | null;
  state: string | null;
  serviceArea: string | null;
  yearsInBusiness: number | null;
  categories: Array<{ id: string; name: string; displayOrder: number }>;
  trustScore?: {
    score: number;
    isSuspended: boolean;
    suspensionReason: string | null;
    lastCalculatedAt: Date | null;
    badgeLevel: { code: string; label: string } | null;
  } | null;
}): PublicBusinessProfile {
  return {
    id: profile.id,
    slug: profile.slug,
    businessName: profile.businessName,
    isPublished: profile.isPublished,
    headline: profile.headline,
    description: profile.description,
    publicEmail: profile.publicEmail,
    publicPhone: profile.publicPhone,
    whatsapp: profile.whatsapp,
    websiteUrl: profile.websiteUrl,
    city: profile.city,
    state: profile.state,
    serviceArea: profile.serviceArea,
    yearsInBusiness: profile.yearsInBusiness,
    categories: profile.categories,
    trust: profile.trustScore ? {
      score: profile.trustScore.score,
      badgeCode: profile.trustScore.badgeLevel?.code.toLowerCase() ?? "none",
      badgeLabel: profile.trustScore.badgeLevel?.label ?? "Sem selo",
      isSuspended: profile.trustScore.isSuspended,
      suspensionReason: profile.trustScore.suspensionReason,
      lastCalculatedAt: profile.trustScore.lastCalculatedAt?.toISOString() ?? null
    } : null
  };
}

function mapService(service: {
  id: string;
  title: string;
  description: string | null;
  priceLabel: string | null;
  displayOrder: number;
}): BusinessServiceView {
  return {
    id: service.id,
    title: service.title,
    description: service.description,
    priceLabel: service.priceLabel,
    displayOrder: service.displayOrder
  };
}

function mapPortfolioItem(item: {
  id: string;
  title: string;
  description: string | null;
  mediaUrl: string | null;
  displayOrder: number;
}): PortfolioItemView {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    mediaUrl: item.mediaUrl,
    displayOrder: item.displayOrder
  };
}

async function ensureBusinessUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error("BUSINESS_ACCOUNT_NOT_FOUND");
  }

  if (user.role !== UserRole.BUSINESS) {
    throw new Error("BUSINESS_ROLE_REQUIRED");
  }

  return user;
}

export async function ensureBusinessProfile(userId: string) {
  const user = await ensureBusinessUser(userId);
  const baseName = user.businessName ?? user.displayName;
  const slug = normalizeSlug(baseName);

  const profile = await prisma.businessProfile.upsert({
    where: { userId },
    update: {
      businessName: baseName,
      slug: slug || userId,
      publicEmail: user.email,
      publicPhone: user.phone
    },
    create: {
      userId,
      businessName: baseName,
      slug: slug || userId,
      publicEmail: user.email,
      publicPhone: user.phone,
      isPublished: false
    },
    include: {
      categories: {
        orderBy: { displayOrder: "asc" }
      },
      trustScore: { include: { badgeLevel: true } }
    }
  });

  return mapProfile(profile);
}

async function createUniqueSlug(baseValue: string, currentProfileId?: string) {
  const baseSlug = normalizeSlug(baseValue) || "business";
  let candidate = baseSlug;
  let sequence = 1;

  while (true) {
    const conflict = await prisma.businessProfile.findFirst({
      where: {
        slug: candidate,
        ...(currentProfileId ? { id: { not: currentProfileId } } : {})
      },
      select: { id: true }
    });

    if (!conflict) {
      return candidate;
    }

    sequence += 1;
    candidate = `${baseSlug}-${sequence}`;
  }
}

export async function updateOwnBusinessProfile(
  userId: string,
  input: {
    businessName?: string;
    headline?: string;
    description?: string;
    publicEmail?: string;
    publicPhone?: string;
    whatsapp?: string;
    websiteUrl?: string;
    city?: string;
    state?: string;
    serviceArea?: string;
    yearsInBusiness?: number;
    isPublished?: boolean;
    categories?: string[];
  }
) {
  await ensureBusinessUser(userId);
  const existing = await ensureBusinessProfile(userId);
  const slug = await createUniqueSlug(input.businessName ?? existing.businessName, existing.id);

  const updated = await prisma.$transaction(async (transaction) => {
    const profile = await transaction.businessProfile.update({
      where: { userId },
      data: {
        businessName: input.businessName ?? existing.businessName,
        slug,
        headline: input.headline,
        description: input.description,
        publicEmail: input.publicEmail,
        publicPhone: input.publicPhone,
        whatsapp: input.whatsapp,
        websiteUrl: input.websiteUrl,
        city: input.city,
        state: input.state,
        serviceArea: input.serviceArea,
        yearsInBusiness: input.yearsInBusiness,
        isPublished: input.isPublished ?? false
      },
      include: { categories: { orderBy: { displayOrder: "asc" } } }
    });

    if (input.categories) {
      await transaction.businessCategory.deleteMany({ where: { businessProfileId: profile.id } });
      if (input.categories.length > 0) {
        await transaction.businessCategory.createMany({
          data: input.categories.map((name, index) => ({
            businessProfileId: profile.id,
            name,
            displayOrder: index
          }))
        });
      }
    }

    return transaction.businessProfile.findUniqueOrThrow({
      where: { id: profile.id },
      include: { categories: { orderBy: { displayOrder: "asc" } } }
    });
  });

  await prisma.auditLog.create({
    data: {
      action: "profiles.business-profile.updated",
      actorUserId: userId,
      entityType: "business_profile",
      entityId: updated.id,
      metadata: {
        slug: updated.slug,
        isPublished: updated.isPublished
      }
    }
  });

  await recalculateBusinessTrustScore(updated.id, userId, "Business profile updated");
  await syncBusinessSearchIndex(updated.id);

  return mapProfile(updated);
}

export async function getOwnBusinessProfile(userId: string) {
  const profile = await prisma.businessProfile.findUnique({
    where: { userId },
    include: {
      categories: { orderBy: { displayOrder: "asc" } },
      services: { orderBy: { displayOrder: "asc" } },
      portfolioItems: { orderBy: { displayOrder: "asc" } },
      trustScore: { include: { badgeLevel: true } }
    }
  });

  if (!profile) {
    return {
      profile: await ensureBusinessProfile(userId),
      services: [] as BusinessServiceView[],
      portfolioItems: [] as PortfolioItemView[]
    };
  }

  return {
    profile: mapProfile(profile),
    services: profile.services.map(mapService),
    portfolioItems: profile.portfolioItems.map(mapPortfolioItem)
  };
}

export async function getPublicBusinessBySlug(slug: string) {
  const profile = await prisma.businessProfile.findFirst({
    where: {
      slug,
      isPublished: true
    },
    include: {
      categories: { orderBy: { displayOrder: "asc" } },
      services: { orderBy: { displayOrder: "asc" } },
      portfolioItems: { orderBy: { displayOrder: "asc" } },
      trustScore: { include: { badgeLevel: true } }
    }
  });

  if (!profile) {
    throw new Error("BUSINESS_PROFILE_NOT_FOUND");
  }

  return {
    profile: mapProfile(profile),
    services: profile.services.map(mapService),
    portfolioItems: profile.portfolioItems.map(mapPortfolioItem)
  };
}

export async function getPublicBusinessServices(profileId: string) {
  const services = await prisma.businessService.findMany({
    where: {
      businessProfileId: profileId,
      businessProfile: { isPublished: true }
    },
    orderBy: { displayOrder: "asc" }
  });

  return services.map(mapService);
}

export async function getPublicPortfolioItems(profileId: string) {
  const items = await prisma.portfolioItem.findMany({
    where: {
      businessProfileId: profileId,
      businessProfile: { isPublished: true }
    },
    orderBy: { displayOrder: "asc" }
  });

  return items.map(mapPortfolioItem);
}

async function getOwnedBusinessProfileId(userId: string) {
  await ensureBusinessUser(userId);
  const profile = await prisma.businessProfile.findUnique({ where: { userId }, select: { id: true } });

  if (!profile) {
    const ensured = await ensureBusinessProfile(userId);
    return ensured.id;
  }

  return profile.id;
}

export async function createOwnBusinessService(
  userId: string,
  input: { title: string; description?: string; priceLabel?: string; displayOrder?: number }
) {
  const businessProfileId = await getOwnedBusinessProfileId(userId);
  const service = await prisma.businessService.create({
    data: {
      businessProfileId,
      title: input.title,
      description: input.description,
      priceLabel: input.priceLabel,
      displayOrder: input.displayOrder ?? 0
    }
  });

  await syncBusinessSearchIndex(businessProfileId);
  await recalculateBusinessTrustScore(businessProfileId, userId, "Business service created");
  await syncBusinessSearchIndex(businessProfileId);

  return mapService(service);
}

export async function updateOwnBusinessService(
  userId: string,
  serviceId: string,
  input: { title?: string; description?: string; priceLabel?: string; displayOrder?: number }
) {
  const businessProfileId = await getOwnedBusinessProfileId(userId);
  const service = await prisma.businessService.findFirst({ where: { id: serviceId, businessProfileId } });

  if (!service) {
    throw new Error("BUSINESS_SERVICE_NOT_FOUND");
  }

  const updated = await prisma.businessService.update({
    where: { id: serviceId },
    data: input
  });

  await recalculateBusinessTrustScore(businessProfileId, userId, "Business service updated");
  await syncBusinessSearchIndex(businessProfileId);

  return mapService(updated);
}

export async function deleteOwnBusinessService(userId: string, serviceId: string) {
  const businessProfileId = await getOwnedBusinessProfileId(userId);
  const service = await prisma.businessService.findFirst({ where: { id: serviceId, businessProfileId } });

  if (!service) {
    throw new Error("BUSINESS_SERVICE_NOT_FOUND");
  }

  await prisma.businessService.delete({ where: { id: serviceId } });
  await recalculateBusinessTrustScore(businessProfileId, userId, "Business service deleted");
  await syncBusinessSearchIndex(businessProfileId);
}

export async function createOwnPortfolioItem(
  userId: string,
  input: { title: string; description?: string; mediaUrl?: string; displayOrder?: number }
) {
  const businessProfileId = await getOwnedBusinessProfileId(userId);
  const item = await prisma.portfolioItem.create({
    data: {
      businessProfileId,
      title: input.title,
      description: input.description,
      mediaUrl: input.mediaUrl,
      displayOrder: input.displayOrder ?? 0
    }
  });

  await recalculateBusinessTrustScore(businessProfileId, userId, "Portfolio item created");
  await syncBusinessSearchIndex(businessProfileId);

  return mapPortfolioItem(item);
}

export async function updateOwnPortfolioItem(
  userId: string,
  portfolioItemId: string,
  input: { title?: string; description?: string; mediaUrl?: string; displayOrder?: number }
) {
  const businessProfileId = await getOwnedBusinessProfileId(userId);
  const item = await prisma.portfolioItem.findFirst({ where: { id: portfolioItemId, businessProfileId } });

  if (!item) {
    throw new Error("PORTFOLIO_ITEM_NOT_FOUND");
  }

  const updated = await prisma.portfolioItem.update({
    where: { id: portfolioItemId },
    data: input
  });

  await recalculateBusinessTrustScore(businessProfileId, userId, "Portfolio item updated");
  await syncBusinessSearchIndex(businessProfileId);

  return mapPortfolioItem(updated);
}

export async function deleteOwnPortfolioItem(userId: string, portfolioItemId: string) {
  const businessProfileId = await getOwnedBusinessProfileId(userId);
  const item = await prisma.portfolioItem.findFirst({ where: { id: portfolioItemId, businessProfileId } });

  if (!item) {
    throw new Error("PORTFOLIO_ITEM_NOT_FOUND");
  }

  await prisma.portfolioItem.delete({ where: { id: portfolioItemId } });
  await recalculateBusinessTrustScore(businessProfileId, userId, "Portfolio item deleted");
  await syncBusinessSearchIndex(businessProfileId);
}
