import type { FastifyRequest } from "fastify";
import {
  ACCESS_TOKEN_COOKIE,
  extractCookieValue,
  getAuthenticatedAccountFromAccessToken,
  getUserPermissions
} from "@platform/auth";
import { getCurrentUser, getPermissions, resolveRole } from "../domain/core-store";

export async function getRequestContext(request: FastifyRequest) {
  const accessToken = extractCookieValue(request.headers.cookie, ACCESS_TOKEN_COOKIE);
  const authenticatedAccount = await getAuthenticatedAccountFromAccessToken(accessToken);

  if (authenticatedAccount) {
    return {
      role: authenticatedAccount.role,
      user: {
        id: authenticatedAccount.id,
        name: authenticatedAccount.displayName,
        email: authenticatedAccount.email,
        role: authenticatedAccount.role
      },
      permissions: getUserPermissions(authenticatedAccount.role)
    };
  }

  const role = resolveRole(request.headers["x-demo-role"] as string | undefined);

  return {
    role,
    user: getCurrentUser(role),
    permissions: getPermissions(role)
  };
}
