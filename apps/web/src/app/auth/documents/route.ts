import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  getAuthenticatedAccountFromAccessToken,
  uploadVerificationDocument
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
    await uploadVerificationDocument({
      userId: account.id,
      documentType: String(formData.get("documentType") ?? ""),
      fileName: String(formData.get("fileName") ?? "")
    });
    return NextResponse.redirect(new URL("/verification?documentUploaded=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/verification?error=document-upload", request.url));
  }
}
