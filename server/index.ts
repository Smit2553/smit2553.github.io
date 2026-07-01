import { app } from "./app";
import { PORT } from "./config";
import { initializeAdminAuth } from "./auth";
import { initializeStorage } from "./storage";

async function main(): Promise<void> {
  await initializeStorage();
  await initializeAdminAuth();

  const server = app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });

  server.on("error", (error) => {
    console.error(error);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
