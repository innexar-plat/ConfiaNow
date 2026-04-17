import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  getAuthenticatedAccountFromAccessToken,
  requestOtpCode
} from "@platform/auth";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);

  if (!account) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const otp = await requestOtpCode({ userId: account.id, channel: "phone" });
  return NextResponse.redirect(new URL(`/verification?phoneCode=${otp.devCode}`, request.url));
}
