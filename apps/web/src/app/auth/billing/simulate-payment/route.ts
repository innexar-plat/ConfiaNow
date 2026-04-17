import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, getAuthenticatedAccountFromAccessToken } from "@platform/auth";
import { handleBillingWebhook, signBillingWebhookPayload } from "@platform/billing";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const account = await getAuthenticatedAccountFromAccessToken(accessToken);

  if (!account || account.role !== "business") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const formData = await request.formData();
  const paymentId = String(formData.get("paymentId") ?? "");
  const checkout = String(formData.get("checkout") ?? "");

  if (!paymentId) {
    return NextResponse.redirect(new URL("/dashboard/billing?error=payment", request.url));
  }

  const payload = JSON.stringify({
    id: `evt_${randomUUID()}`,
    type: "invoice.payment_succeeded",
    apiVersion: "2026-04-17",
    createdAt: new Date().toISOString(),
    data: {
      paymentId,
      providerReference: checkout || undefined,
      paidAt: new Date().toISOString()
    }
  });

  const { timestamp, signature } = signBillingWebhookPayload(payload);

  try {
    await handleBillingWebhook({ payload, timestamp, signature });
    return NextResponse.redirect(new URL("/dashboard/billing?paymentSimulated=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/dashboard/billing?error=payment", request.url));
  }
}
