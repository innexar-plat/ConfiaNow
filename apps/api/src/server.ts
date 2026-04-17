import { platformConfig } from "../../../packages/config/src/platform";
import { createApp } from "./app";

const app = await createApp();

const port = Number(process.env.PORT ?? 3333);

app.listen({ port, host: "0.0.0.0" }).then(() => {
  app.log.info(`${platformConfig.name} API running on port ${port}`);
});
