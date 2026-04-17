import "dotenv/config";
import {
  NotificationType,
  NotificationChannel,
  NotificationDeliveryStatus,
  CampaignRunStatus,
  UserRole,
  type Prisma
} from "@prisma/client";
import { prisma } from "@platform/database";

export type NotificationView = {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationPreferenceView = {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  leadAlertsEnabled: boolean;
  reviewAlertsEnabled: boolean;
  marketingEnabled: boolean;
  updatedAt: string;
};

export type CampaignRunView = {
  id: string;
  campaignCode: string;
  targetRole: string | null;
  title: string;
  body: string;
  status: string;
  recipientsCount: number;
  deliveredCount: number;
  failedCount: number;
  createdAt: string;
};

function toJsonValue(value: Record<string, unknown> | undefined): Prisma.InputJsonValue | undefined {
  if (!value) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
}

function parsePagination(page: unknown, limit: unknown) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  return { page: p, limit: l, skip: (p - 1) * l };
}

async function requireUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("USER_NOT_FOUND");
  return user;
}

async function requireAdmin(userId: string) {
  const user = await requireUser(userId);
  if (user.role !== UserRole.ADMIN) {
    throw new Error("ADMIN_ROLE_REQUIRED");
  }
  return user;
}

function mapNotificationType(type: NotificationType) {
  return type.toLowerCase();
}

function mapDeliveryStatus(status: NotificationDeliveryStatus) {
  return status.toLowerCase();
}

function mapCampaignStatus(status: CampaignRunStatus) {
  return status.toLowerCase();
}

function toNotificationView(item: {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata: unknown;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}): NotificationView {
  return {
    id: item.id,
    type: mapNotificationType(item.type),
    title: item.title,
    body: item.body,
    metadata: (item.metadata ?? null) as Record<string, unknown> | null,
    isRead: item.isRead,
    readAt: item.readAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString()
  };
}

function toPreferenceView(item: {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  leadAlertsEnabled: boolean;
  reviewAlertsEnabled: boolean;
  marketingEnabled: boolean;
  updatedAt: Date;
}): NotificationPreferenceView {
  return {
    inAppEnabled: item.inAppEnabled,
    emailEnabled: item.emailEnabled,
    pushEnabled: item.pushEnabled,
    leadAlertsEnabled: item.leadAlertsEnabled,
    reviewAlertsEnabled: item.reviewAlertsEnabled,
    marketingEnabled: item.marketingEnabled,
    updatedAt: item.updatedAt.toISOString()
  };
}

function toCampaignView(item: {
  id: string;
  campaignCode: string;
  targetRole: UserRole | null;
  title: string;
  body: string;
  status: CampaignRunStatus;
  recipientsCount: number;
  deliveredCount: number;
  failedCount: number;
  createdAt: Date;
}): CampaignRunView {
  return {
    id: item.id,
    campaignCode: item.campaignCode,
    targetRole: item.targetRole?.toLowerCase() ?? null,
    title: item.title,
    body: item.body,
    status: mapCampaignStatus(item.status),
    recipientsCount: item.recipientsCount,
    deliveredCount: item.deliveredCount,
    failedCount: item.failedCount,
    createdAt: item.createdAt.toISOString()
  };
}

export function isNotificationTypeEnabled(input: {
  notificationType: NotificationType;
  inAppEnabled: boolean;
  leadAlertsEnabled: boolean;
  reviewAlertsEnabled: boolean;
  marketingEnabled: boolean;
}) {
  if (!input.inAppEnabled) {
    return false;
  }

  if (input.notificationType === NotificationType.LEAD_CREATED || input.notificationType === NotificationType.LEAD_UPDATED) {
    return input.leadAlertsEnabled;
  }

  if (input.notificationType === NotificationType.REVIEW_PENDING || input.notificationType === NotificationType.REVIEW_APPROVED) {
    return input.reviewAlertsEnabled;
  }

  if (input.notificationType === NotificationType.CAMPAIGN_ANNOUNCEMENT) {
    return input.marketingEnabled;
  }

  return true;
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferenceView> {
  await requireUser(userId);

  const preferences = await prisma.notificationPreference.upsert({
    where: { userId },
    update: {},
    create: { userId }
  });

  return toPreferenceView(preferences);
}

export async function updateNotificationPreferences(input: {
  userId: string;
  inAppEnabled?: boolean;
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  leadAlertsEnabled?: boolean;
  reviewAlertsEnabled?: boolean;
  marketingEnabled?: boolean;
}): Promise<NotificationPreferenceView> {
  await requireUser(input.userId);

  const updated = await prisma.notificationPreference.upsert({
    where: { userId: input.userId },
    update: {
      ...(typeof input.inAppEnabled === "boolean" ? { inAppEnabled: input.inAppEnabled } : {}),
      ...(typeof input.emailEnabled === "boolean" ? { emailEnabled: input.emailEnabled } : {}),
      ...(typeof input.pushEnabled === "boolean" ? { pushEnabled: input.pushEnabled } : {}),
      ...(typeof input.leadAlertsEnabled === "boolean" ? { leadAlertsEnabled: input.leadAlertsEnabled } : {}),
      ...(typeof input.reviewAlertsEnabled === "boolean" ? { reviewAlertsEnabled: input.reviewAlertsEnabled } : {}),
      ...(typeof input.marketingEnabled === "boolean" ? { marketingEnabled: input.marketingEnabled } : {})
    },
    create: {
      userId: input.userId,
      inAppEnabled: input.inAppEnabled ?? true,
      emailEnabled: input.emailEnabled ?? true,
      pushEnabled: input.pushEnabled ?? false,
      leadAlertsEnabled: input.leadAlertsEnabled ?? true,
      reviewAlertsEnabled: input.reviewAlertsEnabled ?? true,
      marketingEnabled: input.marketingEnabled ?? false
    }
  });

  await prisma.auditLog.create({
    data: {
      action: "notifications.preferences.updated",
      actorUserId: input.userId,
      entityType: "notification_preferences",
      entityId: updated.id,
      metadata: {
        inAppEnabled: updated.inAppEnabled,
        emailEnabled: updated.emailEnabled,
        pushEnabled: updated.pushEnabled,
        leadAlertsEnabled: updated.leadAlertsEnabled,
        reviewAlertsEnabled: updated.reviewAlertsEnabled,
        marketingEnabled: updated.marketingEnabled
      }
    }
  });

  return toPreferenceView(updated);
}

export async function listNotifications(input: {
  userId: string;
  page?: unknown;
  limit?: unknown;
}): Promise<{ data: NotificationView[]; meta: { total: number; page: number; limit: number; unreadCount: number } }> {
  await requireUser(input.userId);
  const { page, limit, skip } = parsePagination(input.page, input.limit);

  const where = { userId: input.userId };

  const [items, total, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { ...where, isRead: false } })
  ]);

  return {
    data: items.map(toNotificationView),
    meta: { total, page, limit, unreadCount }
  };
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<NotificationView> {
  await requireUser(userId);

  const found = await prisma.notification.findFirst({
    where: { id: notificationId, userId }
  });

  if (!found) {
    throw new Error("NOTIFICATION_NOT_FOUND");
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: found.readAt ?? new Date()
    }
  });

  return toNotificationView(updated);
}

export async function createInAppNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}) {
  await requireUser(input.userId);

  const preferences = await prisma.notificationPreference.upsert({
    where: { userId: input.userId },
    update: {},
    create: { userId: input.userId }
  });

  const enabled = isNotificationTypeEnabled({
    notificationType: input.type,
    inAppEnabled: preferences.inAppEnabled,
    leadAlertsEnabled: preferences.leadAlertsEnabled,
    reviewAlertsEnabled: preferences.reviewAlertsEnabled,
    marketingEnabled: preferences.marketingEnabled
  });

  if (!enabled) {
    return { created: false, reason: "NOTIFICATION_PREFERENCE_DISABLED" as const };
  }

  const created = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      metadata: toJsonValue(input.metadata)
    }
  });

  await prisma.notificationDelivery.create({
    data: {
      notificationId: created.id,
      channel: NotificationChannel.IN_APP,
      status: NotificationDeliveryStatus.SENT,
      provider: "internal",
      attemptCount: 1,
      lastAttemptAt: new Date(),
      deliveredAt: new Date()
    }
  });

  return { created: true, notification: toNotificationView(created) };
}

export async function notifyBusinessNewLead(input: {
  businessUserId: string;
  leadId: string;
  businessSlug: string;
  clientDisplayName: string;
  subject: string;
}) {
  return createInAppNotification({
    userId: input.businessUserId,
    type: NotificationType.LEAD_CREATED,
    title: "Novo lead recebido",
    body: `${input.clientDisplayName} enviou um novo contato: ${input.subject}`,
    metadata: {
      leadId: input.leadId,
      businessSlug: input.businessSlug,
      clientDisplayName: input.clientDisplayName
    }
  });
}

function parseTargetRole(value: unknown): UserRole | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.toUpperCase();
  if (normalized === "CLIENT") return UserRole.CLIENT;
  if (normalized === "BUSINESS") return UserRole.BUSINESS;
  if (normalized === "ADMIN") return UserRole.ADMIN;
  return undefined;
}

export async function triggerCampaign(input: {
  adminUserId: string;
  campaignCode: string;
  title: string;
  body: string;
  targetRole?: unknown;
  metadata?: Record<string, unknown>;
}): Promise<CampaignRunView> {
  await requireAdmin(input.adminUserId);

  const targetRole = parseTargetRole(input.targetRole);

  const users = await prisma.user.findMany({
    where: {
      ...(targetRole ? { role: targetRole } : {})
    },
    select: { id: true }
  });

  const run = await prisma.campaignRun.create({
    data: {
      triggeredByUserId: input.adminUserId,
      campaignCode: input.campaignCode,
      targetRole: targetRole ?? null,
      title: input.title,
      body: input.body,
      metadata: toJsonValue(input.metadata),
      status: CampaignRunStatus.RUNNING,
      recipientsCount: users.length
    }
  });

  let deliveredCount = 0;
  let failedCount = 0;

  for (const user of users) {
    try {
      const result = await createInAppNotification({
        userId: user.id,
        type: NotificationType.CAMPAIGN_ANNOUNCEMENT,
        title: input.title,
        body: input.body,
        metadata: {
          campaignRunId: run.id,
          ...(input.metadata ?? {})
        }
      });

      if (result.created) {
        deliveredCount += 1;
      }
    } catch {
      failedCount += 1;
    }
  }

  const completed = await prisma.campaignRun.update({
    where: { id: run.id },
    data: {
      status: CampaignRunStatus.COMPLETED,
      deliveredCount,
      failedCount
    }
  });

  await prisma.auditLog.create({
    data: {
      action: "notifications.campaign.triggered",
      actorUserId: input.adminUserId,
      entityType: "campaign_runs",
      entityId: run.id,
      metadata: {
        campaignCode: input.campaignCode,
        targetRole: targetRole?.toLowerCase() ?? null,
        recipientsCount: users.length,
        deliveredCount,
        failedCount
      }
    }
  });

  return toCampaignView(completed);
}

export function mapDeliveryStatusForView(status: NotificationDeliveryStatus) {
  return mapDeliveryStatus(status);
}
