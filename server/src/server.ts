import { buildApp } from "./build-app.js";
import { parseEnvironment } from "./config/env.js";
async function startServer() {
  const environment = parseEnvironment();
  const app = await buildApp({ environment });

  const shutdown = async (signal: NodeJS.Signals) => {
    app.log.info({ signal }, "Shutting down server");
    await app.close();
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));

  try {
    await app.listen({
      host: environment.HOST,
      port: environment.PORT,
    });
  } catch (error) {
    app.log.error({ err: error }, "Failed to start server");
    process.exitCode = 1;
    await app.close();
  }
}

void startServer();
