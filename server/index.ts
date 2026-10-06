import type { Server } from "node:http";
import { PORT, productionMode } from "./config";
import { initializeAdminAuth } from "./auth";
import { closeStorage, initializeStorage } from "./storage";

const SHUTDOWN_TIMEOUT_MS = 10_000;

function assertProductionRuntime(): void {
  const nodeProductionMode = process.env.NODE_ENV === "production";

  if (productionMode !== nodeProductionMode) {
    throw new Error("NODE_ENV and BLOG_APP_ENV must both select production or both select development.");
  }
}

function installShutdownHandlers(server: Server): void {
  let shuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.log(`${signal} received; shutting down.`);

    const forceTimer = setTimeout(() => {
      console.error("Graceful shutdown timed out; closing active connections.");
      server.closeAllConnections();
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceTimer.unref();

    server.closeIdleConnections();

    try {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
      await closeStorage();
      clearTimeout(forceTimer);
      process.exitCode = 0;
    } catch (error) {
      clearTimeout(forceTimer);
      console.error("Graceful shutdown failed:", error);
      await closeStorage().catch((closeError) => console.error("Database shutdown failed:", closeError));
      process.exitCode = 1;
    }
  };

  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
}

async function main(): Promise<void> {
  assertProductionRuntime();
  await initializeStorage();
  await initializeAdminAuth();
  const { app } = await import("./app");

  const server = app.listen(PORT, () => {
    installShutdownHandlers(server);
    console.log(`Server listening on http://localhost:${PORT}`);
  });

  server.keepAliveTimeout = 5_000;
  server.headersTimeout = 15_000;
  server.requestTimeout = 30_000;

  server.on("error", (error) => {
    console.error(error);
    process.exitCode = 1;
    void closeStorage();
  });
}

main().catch(async (error) => {
  console.error(error);
  await closeStorage().catch((closeError) => console.error("Database shutdown failed:", closeError));
  process.exitCode = 1;
});
