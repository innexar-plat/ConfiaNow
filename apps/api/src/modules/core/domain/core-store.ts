import { prisma } from "@platform/database";

export type Role = "guest" | "client" | "business" | "admin";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Exclude<Role, "guest">;
};

export type PlatformSetting = {
  allowNewBusinessRegistrations: boolean;
  requireManualReviewForAllReviews: boolean;
  publicSupportEmail: string;
  defaultLocale: "pt-BR" | "en" | "es";
};

export type AuditLog = {
  id: string;
  action: string;
  actor: string;
  createdAt: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

const mockUsers: Record<Exclude<Role, "guest">, CurrentUser> = {
  client: {
    id: "usr_client_001",
    name: "Cliente Verificado",
    email: "cliente@exemplo.com",
    role: "client"
  },
  business: {
    id: "usr_business_001",
    name: "Negocio Verificado",
    email: "negocio@exemplo.com",
    role: "business"
  },
  admin: {
    id: "usr_admin_001",
    name: "Administrador",
    email: "admin@exemplo.com",
    role: "admin"
  }
};

const permissionsByRole: Record<Exclude<Role, "guest">, string[]> = {
  client: ["leads:create", "reviews:create", "profile:read"],
  business: ["business:manage", "leads:reply", "reviews:read", "badge:read"],
  admin: [
    "settings:read",
    "settings:write",
    "audit-logs:read",
    "verifications:manage",
    "reviews:moderate",
    "trust:manage"
  ]
};

const defaultSettings: PlatformSetting = {
  allowNewBusinessRegistrations: true,
  requireManualReviewForAllReviews: true,
  publicSupportEmail: "contato@exemplo.com",
  defaultLocale: "pt-BR"
};

export function resolveRole(roleHeader?: string): Role {
  if (roleHeader === "client" || roleHeader === "business" || roleHeader === "admin") {
    return roleHeader;
  }

  return "guest";
}

export function getCurrentUser(role: Role): CurrentUser | null {
  if (role === "guest") {
    return null;
  }

  return mockUsers[role];
}

export function getPermissions(role: Role): string[] {
  if (role === "guest") {
    return [];
  }

  return permissionsByRole[role];
}

export async function getSettings(): Promise<PlatformSetting> {
  const rows = await prisma.platformSetting.findMany();
  const mapped = new Map<string, unknown>(
    rows.map((row: { key: string; value: unknown }) => [row.key, row.value])
  );

  return {
    allowNewBusinessRegistrations: (mapped.get("allowNewBusinessRegistrations") as boolean | undefined) ?? defaultSettings.allowNewBusinessRegistrations,
    requireManualReviewForAllReviews: (mapped.get("requireManualReviewForAllReviews") as boolean | undefined) ?? defaultSettings.requireManualReviewForAllReviews,
    publicSupportEmail: (mapped.get("publicSupportEmail") as string | undefined) ?? defaultSettings.publicSupportEmail,
    defaultLocale: (mapped.get("defaultLocale") as "pt-BR" | "en" | "es" | undefined) ?? defaultSettings.defaultLocale
  };
}

export async function updateSettings(input: Partial<PlatformSetting>, actor?: string) {
  const next = {
    ...(await getSettings()),
    ...input
  };

  await prisma.$transaction([
    prisma.platformSetting.upsert({
      where: { key: "allowNewBusinessRegistrations" },
      update: { value: next.allowNewBusinessRegistrations },
      create: { key: "allowNewBusinessRegistrations", value: next.allowNewBusinessRegistrations }
    }),
    prisma.platformSetting.upsert({
      where: { key: "requireManualReviewForAllReviews" },
      update: { value: next.requireManualReviewForAllReviews },
      create: { key: "requireManualReviewForAllReviews", value: next.requireManualReviewForAllReviews }
    }),
    prisma.platformSetting.upsert({
      where: { key: "publicSupportEmail" },
      update: { value: next.publicSupportEmail },
      create: { key: "publicSupportEmail", value: next.publicSupportEmail }
    }),
    prisma.platformSetting.upsert({
      where: { key: "defaultLocale" },
      update: { value: next.defaultLocale },
      create: { key: "defaultLocale", value: next.defaultLocale }
    }),
    prisma.auditLog.create({
      data: {
        action: "core.settings.updated",
        actorUserId: actor && isUuid(actor) ? actor : null,
        entityType: "platform_settings",
        metadata: next
      }
    })
  ]);

  return next;
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { actor: true }
  });

  return logs.map((log: { id: string; action: string; createdAt: Date; actor: { displayName: string } | null }) => ({
    id: log.id,
    action: log.action,
    actor: log.actor?.displayName ?? "system",
    createdAt: log.createdAt.toISOString()
  }));
}
