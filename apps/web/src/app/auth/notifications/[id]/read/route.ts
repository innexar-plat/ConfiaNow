import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, getAuthenticatedAccountFromAccessToken } from "@platform/auth";
import { markNotificationRead } from "@platform/notifications";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);

  if (!account) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const { id } = await params;

  try {
    await markNotificationRead(account.id, id);
    return NextResponse.redirect(new URL("/dashboard/notifications?read=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/dashboard/notifications?error=read", request.url));
  }
}
