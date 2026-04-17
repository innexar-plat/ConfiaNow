import type { FastifyInstance } from "fastify";
import { getRequestContext } from "./auth-context";

export async function registerCurrentUserRoutes(app: FastifyInstance) {
  app.get("/me", async (request, reply) => {
    const context = await getRequestContext(request);

    if (!context.user) {
      return reply.status(401).send({
        type: "https://platform.local/problems/unauthorized",
        title: "Unauthorized",
        status: 401,
        detail: "Authentication is required to access this resource",
        instance: "/api/v1/me"
      });
    }

    return {
      data: context.user
    };
  });

  app.get("/me/permissions", async (request, reply) => {
    const context = await getRequestContext(request);

    if (!context.user) {
      return reply.status(401).send({
        type: "https://platform.local/problems/unauthorized",
        title: "Unauthorized",
        status: 401,
        detail: "Authentication is required to access this resource",
        instance: "/api/v1/me/permissions"
      });
    }

    return {
      data: {
        role: context.role,
        permissions: context.permissions
      }
    };
  });
}
