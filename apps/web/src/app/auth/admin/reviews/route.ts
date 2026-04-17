import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, getAuthenticatedAccountFromAccessToken } from "@platform/auth";
import { approveReview, rejectReview, requestMoreInfoForReview } from "@platform/reviews";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);

  if (!account || account.role !== "admin") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const formData = await request.formData();
  const actionType = String(formData.get("actionType") ?? "approve");
  const reviewId = String(formData.get("reviewId") ?? "");
  const decisionNote = String(formData.get("decisionNote") ?? "") || undefined;

  try {
    if (actionType === "reject") {
      await rejectReview({ adminUserId: account.id, reviewId, decisionNote });
    } else if (actionType === "more-info") {
      await requestMoreInfoForReview({ adminUserId: account.id, reviewId, decisionNote });
    } else {
      await approveReview({ adminUserId: account.id, reviewId, decisionNote });
    }

    return NextResponse.redirect(new URL("/admin/settings?reviewUpdated=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/admin/settings?error=review", request.url));
  }
}