import { NextResponse } from "next/server";
import {
  createSessionFromCredentials,
  serializeAccessTokenCookie,
  serializeRefreshTokenCookie
} from "@platform/auth";

export async function POST(request: Request) {
  const formData = await request.formData();

  try {
    const session = await createSessionFromCredentials({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      userAgent: request.headers.get("user-agent") ?? undefined
    });

    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.headers.append("Set-Cookie", serializeAccessTokenCookie(session.accessToken));
    response.headers.append("Set-Cookie", serializeRefreshTokenCookie(session.refreshToken));
    response.cookies.delete("demo-role");
    return response;
  } catch {
    return NextResponse.redirect(new URL("/signin?error=invalid-credentials", request.url));
  }
}
