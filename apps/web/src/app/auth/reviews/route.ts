import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, getAuthenticatedAccountFromAccessToken } from "@platform/auth";
import { createReview } from "@platform/reviews";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);
  if (!account || account.role !== "client") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const formData = await request.formData();
  const leadId = String(formData.get("leadId") ?? "");

  try {
    await createReview({
      clientUserId: account.id,
      leadId,
      rating: Number(formData.get("rating") ?? 0),
      title: String(formData.get("title") ?? ""),
      comment: String(formData.get("comment") ?? ""),
      evidenceNote: String(formData.get("evidenceNote") ?? "") || undefined,
      evidenceReference: String(formData.get("evidenceReference") ?? "") || undefined
    });
    return NextResponse.redirect(new URL(`/dashboard/leads/${leadId}?reviewSubmitted=1`, request.url));
  } catch {
    return NextResponse.redirect(new URL(`/dashboard/leads/${leadId}?error=review`, request.url));
  }
}