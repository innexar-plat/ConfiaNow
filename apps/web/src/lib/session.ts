import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ACCESS_TOKEN_COOKIE,
  getAuthenticatedAccountFromAccessToken
} from "@platform/auth";

export type DemoSession = {
  isAuthenticated: boolean;
  role: "guest" | "client" | "business" | "admin";
  id?: string;
  displayName?: string;
  email?: string;
  verificationStatus?: string;
};

export type AuthenticatedDemoSession = {
  isAuthenticated: true;
  role: "client" | "business" | "admin";
  id?: string;
  displayName?: string;
  email?: string;
  verificationStatus?: string;
};

export async function getDemoSession(): Promise<DemoSession> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const authenticatedAccount = await getAuthenticatedAccountFromAccessToken(accessToken);

  if (authenticatedAccount) {
    return {
      isAuthenticated: true,
      role: authenticatedAccount.role,
      id: authenticatedAccount.id,
      displayName: authenticatedAccount.displayName,
      email: authenticatedAccount.email,
      verificationStatus: authenticatedAccount.verificationStatus
    };
  }

  const role = cookieStore.get("demo-role")?.value;

  if (role === "client" || role === "business" || role === "admin") {
    return {
      isAuthenticated: true,
      role
    };
  }

  return {
    isAuthenticated: false,
    role: "guest"
  };
}

export async function requireDemoRole(
  allowedRoles?: Array<"client" | "business" | "admin">
): Promise<AuthenticatedDemoSession> {
  const session = await getDemoSession();

  if (!session.isAuthenticated) {
    redirect("/signin");
  }

  if (session.role === "guest") {
    redirect("/signin");
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    redirect("/dashboard");
  }

  return {
    isAuthenticated: true,
    role: session.role as AuthenticatedDemoSession["role"],
    id: session.id,
    displayName: session.displayName,
    email: session.email,
    verificationStatus: session.verificationStatus
  };
}

