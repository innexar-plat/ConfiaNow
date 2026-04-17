import { NextResponse } from "next/server";
import {
  createSessionFromCredentials,
  registerClientAccount,
  serializeAccessTokenCookie,
  serializeRefreshTokenCookie
} from "@platform/auth";

export async function POST(request: Request) {
  const formData = await request.formData();

  try {
    await registerClientAccount({
      fullName: String(formData.get("fullName") ?? ""),
      cpf: String(formData.get("cpf") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      birthDate: String(formData.get("birthDate") ?? ""),
      password: String(formData.get("password") ?? "")
    });

    const session = await createSessionFromCredentials({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      userAgent: request.headers.get("user-agent") ?? undefined
    });

    const response = NextResponse.redirect(new URL("/verification", request.url));
    response.headers.append("Set-Cookie", serializeAccessTokenCookie(session.accessToken));
    response.headers.append("Set-Cookie", serializeRefreshTokenCookie(session.refreshToken));
    return response;
  } catch {
    return NextResponse.redirect(new URL("/register/client?error=registration-failed", request.url));
  }
}
