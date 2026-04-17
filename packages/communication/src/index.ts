import { ConversationParticipantRole, UserRole } from "@prisma/client";
import { prisma } from "@platform/database";
import { containsForbiddenMessagePattern } from "./rules";

export type ConversationListItemView = {
  id: string;
  leadId: string;
  subject: string;
  status: string;
  businessName: string;
  clientName: string;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

export type ConversationMessageView = {
  id: string;
  senderUserId: string;
  senderRole: string;
  body: string;
  createdAt: string;
  attachments: Array<{
    id: string;
    fileName: string;
    mimeType: string;
    storageUrl: string;
    sizeBytes: number;
    createdAt: string;
  }>;
};

export type ConversationDetailView = {
  id: string;
  leadId: string;
  subject: string;
  status: string;
  participants: Array<{ userId: string; role: string; lastReadAt: string | null }>;
  messages: ConversationMessageView[];
};

function mapMessage(message: {
  id: string;
  senderUserId: string;
  body: string;
  createdAt: Date;
  sender: { role: UserRole };
  attachments: Array<{ id: string; fileName: string; mimeType: string; storageUrl: string; sizeBytes: number; createdAt: Date }>;
}): ConversationMessageView {
  return {
    id: message.id,
    senderUserId: message.senderUserId,
    senderRole: message.sender.role.toLowerCase(),
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    attachments: message.attachments.map((attachment) => ({
      id: attachment.id,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      storageUrl: attachment.storageUrl,
      sizeBytes: attachment.sizeBytes,
      createdAt: attachment.createdAt.toISOString()
    }))
  };
}

export { containsForbiddenMessagePattern } from "./rules";

function toParticipantRole(role: UserRole) {
  if (role === UserRole.CLIENT) return ConversationParticipantRole.CLIENT;
  if (role === UserRole.BUSINESS) return ConversationParticipantRole.BUSINESS;
  return ConversationParticipantRole.ADMIN;
}

async function getUserRole(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) throw new Error("USER_NOT_FOUND");
  return user.role;
}

async function assertLeadParticipant(leadId: string, userId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      client: { select: { id: true, displayName: true } },
      businessProfile: { select: { id: true, businessName: true, userId: true } }
    }
  });

  if (!lead) throw new Error("LEAD_NOT_FOUND");
  const isParticipant = lead.client.id === userId || lead.businessProfile.userId === userId;
  if (!isParticipant) throw new Error("CONVERSATION_ACCESS_FORBIDDEN");

  return lead;
}

async function assertConversationParticipant(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      lead: {
        select: {
          id: true,
          subject: true,
          status: true,
          client: { select: { id: true, displayName: true } },
          businessProfile: { select: { userId: true, businessName: true } }
        }
      },
      participants: true
    }
  });

  if (!conversation) throw new Error("CONVERSATION_NOT_FOUND");
  if (!conversation.participants.some((participant) => participant.userId === userId)) {
    throw new Error("CONVERSATION_ACCESS_FORBIDDEN");
  }

  return conversation;
}

export async function createConversation(input: { actorUserId: string; leadId: string }) {
  const lead = await assertLeadParticipant(input.leadId, input.actorUserId);
  const clientRole = await getUserRole(lead.client.id);
  const businessRole = await getUserRole(lead.businessProfile.userId);

  const conversation = await prisma.conversation.upsert({
    where: { leadId: lead.id },
    update: {},
    create: {
      leadId: lead.id,
      participants: {
        create: [
          {
            userId: lead.client.id,
            role: toParticipantRole(clientRole),
            lastReadAt: new Date()
          },
          {
            userId: lead.businessProfile.userId,
            role: toParticipantRole(businessRole),
            lastReadAt: new Date()
          }
        ]
      }
    },
    include: {
      lead: { select: { id: true, subject: true, status: true } },
      participants: { select: { userId: true, role: true, lastReadAt: true } },
      messages: { include: { sender: { select: { role: true } }, attachments: true }, orderBy: { createdAt: "asc" } }
    }
  });

  return {
    id: conversation.id,
    leadId: conversation.lead.id,
    subject: conversation.lead.subject,
    status: conversation.lead.status.toLowerCase(),
    participants: conversation.participants.map((participant) => ({
      userId: participant.userId,
      role: participant.role.toLowerCase(),
      lastReadAt: participant.lastReadAt?.toISOString() ?? null
    })),
    messages: conversation.messages.map(mapMessage)
  } satisfies ConversationDetailView;
}

export async function listConversations(userId: string): Promise<ConversationListItemView[]> {
  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    include: {
      lead: {
        select: {
          id: true,
          subject: true,
          status: true,
          client: { select: { displayName: true } },
          businessProfile: { select: { businessName: true } }
        }
      },
      participants: { where: { userId }, select: { lastReadAt: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 }
    },
    orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }]
  });

  return Promise.all(conversations.map(async (conversation) => {
    const lastReadAt = conversation.participants[0]?.lastReadAt;
    const unreadCount = await prisma.conversationMessage.count({
      where: {
        conversationId: conversation.id,
        senderUserId: { not: userId },
        createdAt: lastReadAt ? { gt: lastReadAt } : undefined
      }
    });

    return {
      id: conversation.id,
      leadId: conversation.lead.id,
      subject: conversation.lead.subject,
      status: conversation.lead.status.toLowerCase(),
      businessName: conversation.lead.businessProfile.businessName,
      clientName: conversation.lead.client.displayName,
      lastMessagePreview: conversation.messages[0]?.body.slice(0, 120) ?? null,
      lastMessageAt: conversation.messages[0]?.createdAt.toISOString() ?? null,
      unreadCount
    };
  }));
}

export async function getConversationMessages(userId: string, conversationId: string): Promise<ConversationDetailView> {
  const conversation = await assertConversationParticipant(conversationId, userId);

  const full = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversation.id },
    include: {
      lead: { select: { id: true, subject: true, status: true } },
      participants: { select: { userId: true, role: true, lastReadAt: true } },
      messages: {
        include: {
          sender: { select: { role: true } },
          attachments: { orderBy: { createdAt: "asc" } }
        },
        orderBy: { createdAt: "asc" }
      }
    }
  });

  return {
    id: full.id,
    leadId: full.lead.id,
    subject: full.lead.subject,
    status: full.lead.status.toLowerCase(),
    participants: full.participants.map((participant) => ({
      userId: participant.userId,
      role: participant.role.toLowerCase(),
      lastReadAt: participant.lastReadAt?.toISOString() ?? null
    })),
    messages: full.messages.map(mapMessage)
  };
}

export async function sendConversationMessage(input: { actorUserId: string; conversationId: string; body: string }) {
  if (input.body.trim().length < 2 || input.body.trim().length > 2000) {
    throw new Error("INVALID_MESSAGE_BODY");
  }

  if (containsForbiddenMessagePattern(input.body)) {
    throw new Error("FORBIDDEN_MESSAGE_PATTERN");
  }

  await assertConversationParticipant(input.conversationId, input.actorUserId);

  const message = await prisma.$transaction(async (transaction) => {
    const created = await transaction.conversationMessage.create({
      data: {
        conversationId: input.conversationId,
        senderUserId: input.actorUserId,
        body: input.body.trim()
      },
      include: {
        sender: { select: { role: true } },
        attachments: true
      }
    });

    await transaction.conversation.update({
      where: { id: input.conversationId },
      data: { lastMessageAt: created.createdAt }
    });

    return created;
  });

  return mapMessage(message);
}

export async function addMessageAttachment(input: {
  actorUserId: string;
  messageId: string;
  fileName: string;
  mimeType: string;
  storageUrl: string;
  sizeBytes: number;
}) {
  if (input.fileName.trim().length < 2) throw new Error("INVALID_ATTACHMENT");
  if (input.mimeType.trim().length < 3) throw new Error("INVALID_ATTACHMENT");
  if (!input.storageUrl.trim()) throw new Error("INVALID_ATTACHMENT");
  if (!Number.isInteger(input.sizeBytes) || input.sizeBytes <= 0 || input.sizeBytes > 10 * 1024 * 1024) {
    throw new Error("INVALID_ATTACHMENT");
  }

  const message = await prisma.conversationMessage.findUnique({
    where: { id: input.messageId },
    include: { conversation: { include: { participants: true } } }
  });

  if (!message) throw new Error("MESSAGE_NOT_FOUND");
  if (!message.conversation.participants.some((participant) => participant.userId === input.actorUserId)) {
    throw new Error("CONVERSATION_ACCESS_FORBIDDEN");
  }
  if (message.senderUserId !== input.actorUserId) {
    throw new Error("ATTACHMENT_OWNER_REQUIRED");
  }

  return prisma.messageAttachment.create({
    data: {
      messageId: message.id,
      fileName: input.fileName.trim(),
      mimeType: input.mimeType.trim(),
      storageUrl: input.storageUrl.trim(),
      sizeBytes: input.sizeBytes
    }
  });
}

export async function markConversationAsRead(input: { actorUserId: string; conversationId: string }) {
  await assertConversationParticipant(input.conversationId, input.actorUserId);

  await prisma.conversationParticipant.updateMany({
    where: {
      conversationId: input.conversationId,
      userId: input.actorUserId
    },
    data: {
      lastReadAt: new Date()
    }
  });

  return { success: true };
}

export async function sendMessageForLead(input: { actorUserId: string; leadId: string; body: string }) {
  const conversation = await createConversation({ actorUserId: input.actorUserId, leadId: input.leadId });
  return sendConversationMessage({ actorUserId: input.actorUserId, conversationId: conversation.id, body: input.body });
}

export async function markLeadConversationAsRead(input: { actorUserId: string; leadId: string }) {
  const conversation = await prisma.conversation.findUnique({ where: { leadId: input.leadId } });
  if (!conversation) throw new Error("CONVERSATION_NOT_FOUND");
  return markConversationAsRead({ actorUserId: input.actorUserId, conversationId: conversation.id });
}

export async function getLeadConversationMessages(input: { actorUserId: string; leadId: string }): Promise<ConversationMessageView[]> {
  const conversation = await prisma.conversation.findUnique({ where: { leadId: input.leadId } });
  if (!conversation) {
    await assertLeadParticipant(input.leadId, input.actorUserId);
    return [];
  }

  const detail = await getConversationMessages(input.actorUserId, conversation.id);
  return detail.messages;
}