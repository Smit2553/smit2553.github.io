import { app } from "./app";
import { PORT } from "./config";
import { initializeAdminAuth } from "./auth";
import { initializeStorage } from "./storage";

initializeStorage();
initializeAdminAuth();

const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

server.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
