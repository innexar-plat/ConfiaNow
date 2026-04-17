import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { trackContactClick } from "@platform/analytics";
import { ACCESS_TOKEN_COOKIE, getAuthenticatedAccountFromAccessToken } from "@platform/auth";
import { createLead } from "@platform/leads";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);
  if (!account || account.role !== "client") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const formData = await request.formData();

  try {
    const businessSlug = String(formData.get("businessSlug") ?? "");
    await trackContactClick({
      businessSlug,
      actorUserId: account.id,
      channel: "lead_form",
      destination: "/auth/leads"
    });

    const lead = await createLead({
      clientUserId: account.id,
      businessSlug,
      subject: String(formData.get("subject") ?? ""),
      message: String(formData.get("message") ?? "")
    });
    return NextResponse.redirect(new URL(`/dashboard/leads/${lead.id}?created=1`, request.url));
  } catch {
    const fallbackSlug = String(formData.get("businessSlug") ?? "");
    return NextResponse.redirect(new URL(`/businesses/${fallbackSlug}?error=lead-create`, request.url));
  }
}