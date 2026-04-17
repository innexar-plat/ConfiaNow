import type { FastifyInstance } from "fastify";
import { platformConfig } from "../../../../../../packages/config/src/platform";

export async function registerPublicConfigRoutes(app: FastifyInstance) {
  app.get("/config/public", async () => ({
    data: {
      name: platformConfig.name,
      slug: platformConfig.slug,
      tagline: platformConfig.tagline,
      defaultLocale: platformConfig.defaultLocale,
      supportEmail: platformConfig.supportEmail
    }
  }));
}
