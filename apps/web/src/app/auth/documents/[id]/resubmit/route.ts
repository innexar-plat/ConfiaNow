import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  getAuthenticatedAccountFromAccessToken
} from "@platform/auth";
import { resubmitMyDocument } from "@platform/evidence";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);

  if (!account) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const params = await context.params;
  const formData = await request.formData();

  try {
    await resubmitMyDocument({
      actorUserId: account.id,
      documentId: params.id,
      originalName: String(formData.get("originalName") ?? ""),
      mimeType: String(formData.get("mimeType") ?? ""),
      sizeBytes: Number(formData.get("sizeBytes") ?? 0),
      storageUrl: String(formData.get("storageUrl") ?? ""),
      checksumSha256: String(formData.get("checksumSha256") ?? "") || undefined
    });

    return NextResponse.redirect(new URL("/verification?documentResubmitted=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/verification?error=document-resubmit", request.url));
  }
}
