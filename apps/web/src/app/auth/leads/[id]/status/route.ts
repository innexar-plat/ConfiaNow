import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { LeadStatus } from "@prisma/client";
import { ACCESS_TOKEN_COOKIE, getAuthenticatedAccountFromAccessToken } from "@platform/auth";
import { updateLeadStatus } from "@platform/leads";

const statusMap: Record<string, LeadStatus> = {
  viewed: LeadStatus.VIEWED,
  responded: LeadStatus.RESPONDED,
  closed: LeadStatus.CLOSED,
  contact_released: LeadStatus.CONTACT_RELEASED
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);
  if (!account || account.role !== "business") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }
  const formData = await request.formData();
  const { id } = await params;
  const actionStatus = String(formData.get("status") ?? "viewed");

  try {
    await updateLeadStatus({
      businessUserId: account.id,
      leadId: id,
      nextStatus: statusMap[actionStatus] ?? LeadStatus.VIEWED,
      note: String(formData.get("note") ?? "") || undefined,
      responseMessage: String(formData.get("responseMessage") ?? "") || undefined
    });
    return NextResponse.redirect(new URL(`/dashboard/leads/${id}?updated=1`, request.url));
  } catch {
    return NextResponse.redirect(new URL(`/dashboard/leads/${id}?error=status-update`, request.url));
  }
}