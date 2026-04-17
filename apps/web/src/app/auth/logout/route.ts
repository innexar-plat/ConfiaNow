import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { serializeExpiredAuthCookies } from "@platform/auth";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("demo-role");
  const response = NextResponse.redirect(new URL("/signin", request.url));

  for (const cookieValue of serializeExpiredAuthCookies()) {
    response.headers.append("Set-Cookie", cookieValue);
  }

  return response;
}

