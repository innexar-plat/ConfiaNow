import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, getAuthenticatedAccountFromAccessToken } from "@platform/auth";
import { releaseLeadContact } from "@platform/leads";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);
  if (!account || account.role !== "business") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }
  const formData = await request.formData();
  const { id } = await params;

  try {
    await releaseLeadContact({ businessUserId: account.id, leadId: id, note: String(formData.get("note") ?? "") || undefined });
    return NextResponse.redirect(new URL(`/dashboard/leads/${id}?contactReleased=1`, request.url));
  } catch {
    return NextResponse.redirect(new URL(`/dashboard/leads/${id}?error=contact-release`, request.url));
  }
}