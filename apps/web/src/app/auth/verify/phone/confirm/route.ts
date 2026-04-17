import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  confirmOtpCode,
  getAuthenticatedAccountFromAccessToken
} from "@platform/auth";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);

  if (!account) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const formData = await request.formData();

  try {
    await confirmOtpCode({
      userId: account.id,
      channel: "phone",
      code: String(formData.get("code") ?? "")
    });
    return NextResponse.redirect(new URL("/verification?phoneVerified=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/verification?error=phone-code", request.url));
  }
}
