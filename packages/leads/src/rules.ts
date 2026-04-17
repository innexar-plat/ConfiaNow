import { LeadStatus } from "@prisma/client";

export function isLeadLate(createdAt: Date, status: LeadStatus, respondedAt?: Date | null) {
  if (status === LeadStatus.RESPONDED || status === LeadStatus.CONTACT_RELEASED || respondedAt) {
    return false;
  }

  const hoursOpen = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  return hoursOpen > 24;
}

export function canTransitionLeadStatus(currentStatus: LeadStatus, nextStatus: LeadStatus) {
  const allowed: Record<LeadStatus, LeadStatus[]> = {
    OPEN: [LeadStatus.VIEWED, LeadStatus.RESPONDED, LeadStatus.CLOSED],
    VIEWED: [LeadStatus.RESPONDED, LeadStatus.CLOSED, LeadStatus.CONTACT_RELEASED],
    RESPONDED: [LeadStatus.CONTACT_RELEASED, LeadStatus.CLOSED],
    CONTACT_RELEASED: [LeadStatus.CLOSED],
    CLOSED: []
  };

  return allowed[currentStatus].includes(nextStatus);
}
