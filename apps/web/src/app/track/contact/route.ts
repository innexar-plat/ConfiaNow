import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { trackContactClick } from "@platform/analytics";
import { ACCESS_TOKEN_COOKIE, getAuthenticatedAccountFromAccessToken } from "@platform/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const businessSlug = url.searchParams.get("businessSlug") ?? "";
  const channel = url.searchParams.get("channel") ?? "email";
  const target = url.searchParams.get("target") ?? "/";

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);

  if (businessSlug) {
    await trackContactClick({
      businessSlug,
      actorUserId: account?.id,
      channel: channel === "phone" ? "phone" : channel === "whatsapp" ? "whatsapp" : "email",
      destination: target
    });
  }

  return NextResponse.redirect(target);
}
