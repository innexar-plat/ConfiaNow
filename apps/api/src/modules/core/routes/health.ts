import type { FastifyInstance } from "fastify";

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/health/live", async () => ({ status: "ok" }));

  app.get("/health/ready", async () => ({
    status: "ready",
    checks: {
      api: "ok"
    }
  }));
}
