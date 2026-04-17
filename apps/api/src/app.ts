import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { registerAnalyticsRoutes } from "./modules/analytics/routes/analytics";
import { registerAuthenticationRoutes } from "./modules/auth/routes/auth";
import { registerBillingRoutes } from "./modules/billing/routes/billing";
import { registerCmsRoutes } from "./modules/cms/routes/cms";
import { registerAdminCoreRoutes } from "./modules/core/routes/admin";
import { registerCurrentUserRoutes } from "./modules/core/routes/current-user";
import { registerHealthRoutes } from "./modules/core/routes/health";
import { registerPublicConfigRoutes } from "./modules/core/routes/public-config";
import { registerCommunicationRoutes } from "./modules/communication/routes/communication";
import { registerClientDashboardRoutes } from "./modules/client-dashboard/routes/client-dashboard";
import { registerDiscoveryRoutes } from "./modules/discovery/routes/discovery";
import { registerEvidenceRoutes } from "./modules/evidence/routes/evidence";
import { registerIntegrationsRoutes } from "./modules/integrations/routes/integrations";
import { registerLeadRoutes } from "./modules/leads/routes/leads";
import { registerModerationRoutes } from "./modules/moderation/routes/moderation";
import { registerNotificationsRoutes } from "./modules/notifications/routes/notifications";
import { registerProviderDashboardRoutes } from "./modules/provider-dashboard/routes/provider-dashboard";
import { registerProfilesRoutes } from "./modules/profiles/routes/profiles";
import { registerReviewRoutes } from "./modules/reviews/routes/reviews";
import { registerTrustRoutes } from "./modules/trust/routes/trust";

export async function createApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: true,
    credentials: true
  });
  await app.register(cookie);

  app.register(async (api) => {
    await registerHealthRoutes(api);
    await registerPublicConfigRoutes(api);
    await registerAuthenticationRoutes(api);
    await registerAnalyticsRoutes(api);
    await registerBillingRoutes(api);
    await registerCmsRoutes(api);
    await registerCurrentUserRoutes(api);
    await registerAdminCoreRoutes(api);
    await registerCommunicationRoutes(api);
    await registerClientDashboardRoutes(api);
    await registerDiscoveryRoutes(api);
    await registerEvidenceRoutes(api);
    await registerIntegrationsRoutes(api);
    await registerLeadRoutes(api);
    await registerModerationRoutes(api);
    await registerNotificationsRoutes(api);
    await registerProviderDashboardRoutes(api);
    await registerProfilesRoutes(api);
    await registerReviewRoutes(api);
    await registerTrustRoutes(api);
  }, { prefix: "/api/v1" });

  return app;
}
