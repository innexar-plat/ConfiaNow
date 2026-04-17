import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, getAuthenticatedAccountFromAccessToken } from "@platform/auth";
import { sendMessageForLead } from "@platform/communication";

export async function POST(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);
  if (!account || (account.role !== "client" && account.role !== "business")) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const { leadId } = await params;
  const formData = await request.formData();

  try {
    await sendMessageForLead({
      actorUserId: account.id,
      leadId,
      body: String(formData.get("body") ?? "")
    });

    return NextResponse.redirect(new URL(`/dashboard/leads/${leadId}?messageSent=1`, request.url));
  } catch {
    return NextResponse.redirect(new URL(`/dashboard/leads/${leadId}?error=conversation-message`, request.url));
  }
}