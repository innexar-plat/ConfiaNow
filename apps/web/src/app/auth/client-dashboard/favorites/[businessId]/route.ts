import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, getAuthenticatedAccountFromAccessToken } from "@platform/auth";
import { addClientFavorite, removeClientFavorite } from "@platform/client-dashboard";

export async function POST(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);

  if (!account || account.role !== "client") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const formData = await request.formData();
  const actionType = String(formData.get("actionType") ?? "add");
  const { businessId } = await params;

  try {
    if (actionType === "remove") {
      await removeClientFavorite(account.id, businessId);
    } else {
      await addClientFavorite(account.id, businessId);
    }

    return NextResponse.redirect(new URL("/dashboard?favoritesUpdated=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/dashboard?error=favorites", request.url));
  }
}
