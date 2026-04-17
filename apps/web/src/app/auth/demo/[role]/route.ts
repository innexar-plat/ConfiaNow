import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ role: string }> }
) {
  const { role } = await context.params;
  const requestUrl = new URL(request.url);

  if (role !== "client" && role !== "business" && role !== "admin") {
    return NextResponse.redirect(new URL("/signin", requestUrl));
  }

  const cookieStore = await cookies();
  cookieStore.set("demo-role", role, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/"
  });

  return NextResponse.redirect(new URL("/dashboard", requestUrl));
}
