import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, getAuthenticatedAccountFromAccessToken } from "@platform/auth";
import { updateOwnBusinessProfile } from "@platform/profiles";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);

  if (!account || account.role !== "business") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const formData = await request.formData();

  try {
    await updateOwnBusinessProfile(account.id, {
      businessName: String(formData.get("businessName") ?? ""),
      headline: String(formData.get("headline") ?? "") || undefined,
      description: String(formData.get("description") ?? "") || undefined,
      publicEmail: String(formData.get("publicEmail") ?? "") || undefined,
      publicPhone: String(formData.get("publicPhone") ?? "") || undefined,
      whatsapp: String(formData.get("whatsapp") ?? "") || undefined,
      websiteUrl: String(formData.get("websiteUrl") ?? "") || undefined,
      city: String(formData.get("city") ?? "") || undefined,
      state: String(formData.get("state") ?? "") || undefined,
      serviceArea: String(formData.get("serviceArea") ?? "") || undefined,
      yearsInBusiness: Number(formData.get("yearsInBusiness") ?? 0),
      isPublished: formData.get("isPublished") === "true",
      categories: String(formData.get("categories") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    });
    return NextResponse.redirect(new URL("/dashboard/business-profile?updated=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/dashboard/business-profile?error=profile-update", request.url));
  }
}