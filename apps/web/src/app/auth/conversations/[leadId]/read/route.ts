import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, getAuthenticatedAccountFromAccessToken } from "@platform/auth";
import { markLeadConversationAsRead } from "@platform/communication";

export async function POST(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);
  if (!account) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const { leadId } = await params;

  try {
    await markLeadConversationAsRead({ actorUserId: account.id, leadId });
    return NextResponse.redirect(new URL(`/dashboard/leads/${leadId}?readUpdated=1`, request.url));
  } catch {
    return NextResponse.redirect(new URL(`/dashboard/leads/${leadId}?error=conversation-read`, request.url));
  }
}