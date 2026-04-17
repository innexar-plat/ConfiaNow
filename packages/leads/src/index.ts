import { AnalyticsEventType, LeadMessageSenderRole, LeadStatus, UserRole, type VerificationStatus } from "@prisma/client";
import { recordAnalyticsEvent } from "@platform/analytics";
import { prisma } from "@platform/database";
import { syncBusinessSearchIndex } from "@platform/discovery";
import { notifyBusinessNewLead } from "@platform/notifications";
import { recalculateBusinessTrustScore } from "@platform/trust";
import { canTransitionLeadStatus, isLeadLate } from "./rules";

export type LeadListItem = {
  id: string;
  subject: string;
  status: string;
  businessName: string;
  businessSlug: string;
  clientName: string;
  createdAt: string;
  respondedAt: string | null;
  isLate: boolean;
};

export type LeadDetailView = {
  id: string;
  subject: string;
  status: string;
  messagePreview: string;
  createdAt: string;
  respondedAt: string | null;
  contactReleasedAt: string | null;
  client: { id: string; displayName: string; email: string; phone: string };
  business: { id: string; businessName: string; slug: string; publicEmail: string | null; publicPhone: string | null };
  messages: Array<{ id: string; senderRole: string; body: string; createdAt: string }>;
  statusHistory: Array<{ id: string; fromStatus: string | null; toStatus: string; note: string | null; createdAt: string }>;
  contactReleases: Array<{ id: string; releasedEmail: string | null; releasedPhone: string | null; note: string | null; createdAt: string }>;
};

export { canTransitionLeadStatus, isLeadLate } from "./rules";

async function requireClient(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("CLIENT_NOT_FOUND");
  if (user.role !== UserRole.CLIENT) throw new Error("CLIENT_ROLE_REQUIRED");
  return user;
}

async function requireBusiness(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("BUSINESS_NOT_FOUND");
  if (user.role !== UserRole.BUSINESS) throw new Error("BUSINESS_ROLE_REQUIRED");
  return user;
}

function mapLeadListItem(lead: {
  id: string;
  subject: string;
  status: LeadStatus;
  createdAt: Date;
  respondedAt: Date | null;
  businessProfile: { businessName: string; slug: string };
  client: { displayName: string };
}): LeadListItem {
  return {
    id: lead.id,
    subject: lead.subject,
    status: lead.status.toLowerCase(),
    businessName: lead.businessProfile.businessName,
    businessSlug: lead.businessProfile.slug,
    clientName: lead.client.displayName,
    createdAt: lead.createdAt.toISOString(),
    respondedAt: lead.respondedAt?.toISOString() ?? null,
    isLate: isLeadLate(lead.createdAt, lead.status, lead.respondedAt)
  };
}

function mapLeadDetail(lead: {
  id: string;
  subject: string;
  status: LeadStatus;
  messagePreview: string;
  createdAt: Date;
  respondedAt: Date | null;
  contactReleasedAt: Date | null;
  client: { id: string; displayName: string; email: string; phone: string };
  businessProfile: { id: string; businessName: string; slug: string; publicEmail: string | null; publicPhone: string | null };
  messages: Array<{ id: string; senderRole: LeadMessageSenderRole; body: string; createdAt: Date }>;
  statusHistory: Array<{ id: string; fromStatus: LeadStatus | null; toStatus: LeadStatus; note: string | null; createdAt: Date }>;
  contactReleases: Array<{ id: string; releasedEmail: string | null; releasedPhone: string | null; note: string | null; createdAt: Date }>;
}): LeadDetailView {
  return {
    id: lead.id,
    subject: lead.subject,
    status: lead.status.toLowerCase(),
    messagePreview: lead.messagePreview,
    createdAt: lead.createdAt.toISOString(),
    respondedAt: lead.respondedAt?.toISOString() ?? null,
    contactReleasedAt: lead.contactReleasedAt?.toISOString() ?? null,
    client: lead.client,
    business: {
      id: lead.businessProfile.id,
      businessName: lead.businessProfile.businessName,
      slug: lead.businessProfile.slug,
      publicEmail: lead.businessProfile.publicEmail,
      publicPhone: lead.businessProfile.publicPhone
    },
    messages: lead.messages.map((message) => ({
      id: message.id,
      senderRole: message.senderRole.toLowerCase(),
      body: message.body,
      createdAt: message.createdAt.toISOString()
    })),
    statusHistory: lead.statusHistory.map((history) => ({
      id: history.id,
      fromStatus: history.fromStatus?.toLowerCase() ?? null,
      toStatus: history.toStatus.toLowerCase(),
      note: history.note,
      createdAt: history.createdAt.toISOString()
    })),
    contactReleases: lead.contactReleases.map((release) => ({
      id: release.id,
      releasedEmail: release.releasedEmail,
      releasedPhone: release.releasedPhone,
      note: release.note,
      createdAt: release.createdAt.toISOString()
    }))
  };
}

async function getBusinessProfileForLead(slug: string) {
  const profile = await prisma.businessProfile.findFirst({
    where: { slug, isPublished: true },
    include: { user: true }
  });

  if (!profile) throw new Error("BUSINESS_PROFILE_NOT_FOUND");
  return profile;
}

export async function createLead(input: {
  clientUserId: string;
  businessSlug: string;
  subject: string;
  message: string;
}) {
  const client = await requireClient(input.clientUserId);
  const businessProfile = await getBusinessProfileForLead(input.businessSlug);

  if (businessProfile.userId === client.id) {
    throw new Error("OWN_BUSINESS_LEAD_NOT_ALLOWED");
  }

  const lead = await prisma.$transaction(async (transaction) => {
    const created = await transaction.lead.create({
      data: {
        clientUserId: client.id,
        businessProfileId: businessProfile.id,
        subject: input.subject,
        messagePreview: input.message.slice(0, 280)
      },
      include: {
        client: { select: { displayName: true } },
        businessProfile: { select: { businessName: true, slug: true } }
      }
    });

    await transaction.leadMessage.create({
      data: {
        leadId: created.id,
        senderUserId: client.id,
        senderRole: LeadMessageSenderRole.CLIENT,
        body: input.message
      }
    });

    await transaction.leadStatusHistory.create({
      data: {
        leadId: created.id,
        toStatus: LeadStatus.OPEN,
        actorUserId: client.id,
        note: "Lead created by client"
      }
    });

    return created;
  });

  await prisma.auditLog.create({
    data: {
      action: "leads.created",
      actorUserId: client.id,
      entityType: "lead",
      entityId: lead.id,
      metadata: { businessProfileId: businessProfile.id }
    }
  });

  await recordAnalyticsEvent({
    type: AnalyticsEventType.LEAD_CREATED,
    actorUserId: client.id,
    businessProfileId: businessProfile.id,
    metadata: {
      leadId: lead.id,
      businessSlug: businessProfile.slug
    }
  });

  await notifyBusinessNewLead({
    businessUserId: businessProfile.userId,
    leadId: lead.id,
    businessSlug: businessProfile.slug,
    clientDisplayName: client.displayName,
    subject: lead.subject
  });

  await recalculateBusinessTrustScore(businessProfile.id, client.id, "Lead created");
  await syncBusinessSearchIndex(businessProfile.id);

  return lead;
}

export async function listClientLeads(clientUserId: string) {
  await requireClient(clientUserId);
  const leads = await prisma.lead.findMany({
    where: { clientUserId },
    include: {
      client: { select: { displayName: true } },
      businessProfile: { select: { businessName: true, slug: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return leads.map(mapLeadListItem);
}

export async function listBusinessLeadInbox(businessUserId: string) {
  await requireBusiness(businessUserId);
  const leads = await prisma.lead.findMany({
    where: { businessProfile: { userId: businessUserId } },
    include: {
      client: { select: { displayName: true } },
      businessProfile: { select: { businessName: true, slug: true } }
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }]
  });

  return leads.map(mapLeadListItem);
}

export async function getLeadDetailForUser(userId: string, role: UserRole, leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      client: { select: { id: true, displayName: true, email: true, phone: true } },
      businessProfile: { select: { id: true, businessName: true, slug: true, publicEmail: true, publicPhone: true, userId: true } },
      messages: { orderBy: { createdAt: "asc" } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      contactReleases: { orderBy: { createdAt: "asc" } }
    }
  });

  if (!lead) throw new Error("LEAD_NOT_FOUND");

  const allowed = lead.client.id === userId || lead.businessProfile.userId === userId || role === UserRole.ADMIN;
  if (!allowed) throw new Error("LEAD_ACCESS_FORBIDDEN");

  return mapLeadDetail(lead);
}

export async function updateLeadStatus(input: {
  businessUserId: string;
  leadId: string;
  nextStatus: LeadStatus;
  note?: string;
  responseMessage?: string;
}) {
  await requireBusiness(input.businessUserId);

  const lead = await prisma.lead.findFirst({
    where: { id: input.leadId, businessProfile: { userId: input.businessUserId } },
    include: { businessProfile: { select: { businessName: true, slug: true, userId: true } }, client: { select: { displayName: true } } }
  });

  if (!lead) throw new Error("LEAD_NOT_FOUND");
  if (!canTransitionLeadStatus(lead.status, input.nextStatus)) throw new Error("INVALID_LEAD_STATUS_TRANSITION");

  const updated = await prisma.$transaction(async (transaction) => {
    const next = await transaction.lead.update({
      where: { id: lead.id },
      data: {
        status: input.nextStatus,
        respondedAt: input.nextStatus === LeadStatus.RESPONDED ? new Date() : lead.respondedAt,
        closedAt: input.nextStatus === LeadStatus.CLOSED ? new Date() : lead.closedAt
      },
      include: {
        client: { select: { id: true, displayName: true, email: true, phone: true } },
        businessProfile: { select: { id: true, businessName: true, slug: true, publicEmail: true, publicPhone: true } },
        messages: { orderBy: { createdAt: "asc" } },
        statusHistory: { orderBy: { createdAt: "asc" } },
        contactReleases: { orderBy: { createdAt: "asc" } }
      }
    });

    if (input.responseMessage) {
      await transaction.leadMessage.create({
        data: {
          leadId: lead.id,
          senderUserId: input.businessUserId,
          senderRole: LeadMessageSenderRole.BUSINESS,
          body: input.responseMessage
        }
      });
    }

    await transaction.leadStatusHistory.create({
      data: {
        leadId: lead.id,
        fromStatus: lead.status,
        toStatus: input.nextStatus,
        actorUserId: input.businessUserId,
        note: input.note
      }
    });

    return transaction.lead.findUniqueOrThrow({
      where: { id: lead.id },
      include: {
        client: { select: { id: true, displayName: true, email: true, phone: true } },
        businessProfile: { select: { id: true, businessName: true, slug: true, publicEmail: true, publicPhone: true } },
        messages: { orderBy: { createdAt: "asc" } },
        statusHistory: { orderBy: { createdAt: "asc" } },
        contactReleases: { orderBy: { createdAt: "asc" } }
      }
    });
  });

  await recalculateBusinessTrustScore(updated.businessProfile.id, input.businessUserId, "Lead status updated");
  await syncBusinessSearchIndex(updated.businessProfile.id);

  return mapLeadDetail(updated);
}

export async function releaseLeadContact(input: { businessUserId: string; leadId: string; note?: string }) {
  await requireBusiness(input.businessUserId);
  const lead = await prisma.lead.findFirst({
    where: { id: input.leadId, businessProfile: { userId: input.businessUserId } },
    include: { businessProfile: true }
  });

  if (!lead) throw new Error("LEAD_NOT_FOUND");

  const released = await prisma.$transaction(async (transaction) => {
    const release = await transaction.leadContactRelease.create({
      data: {
        leadId: lead.id,
        actorUserId: input.businessUserId,
        releasedEmail: lead.businessProfile.publicEmail,
        releasedPhone: lead.businessProfile.publicPhone,
        note: input.note
      }
    });

    await transaction.lead.update({
      where: { id: lead.id },
      data: {
        status: LeadStatus.CONTACT_RELEASED,
        contactReleasedAt: new Date()
      }
    });

    await transaction.leadStatusHistory.create({
      data: {
        leadId: lead.id,
        fromStatus: lead.status,
        toStatus: LeadStatus.CONTACT_RELEASED,
        actorUserId: input.businessUserId,
        note: input.note ?? "Contact released"
      }
    });

    return release;
  });

  await recalculateBusinessTrustScore(lead.businessProfileId, input.businessUserId, "Lead contact released");
  await syncBusinessSearchIndex(lead.businessProfileId);

  return released;
}