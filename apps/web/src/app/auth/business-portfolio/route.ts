import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, getAuthenticatedAccountFromAccessToken } from "@platform/auth";
import { createOwnPortfolioItem } from "@platform/profiles";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);

  if (!account || account.role !== "business") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const formData = await request.formData();

  try {
    await createOwnPortfolioItem(account.id, {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
      mediaUrl: String(formData.get("mediaUrl") ?? "") || undefined
    });
    return NextResponse.redirect(new URL("/dashboard/business-profile?updated=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/dashboard/business-profile?error=portfolio-create", request.url));
  }
}