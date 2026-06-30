import { app } from "./app";
import { PORT } from "./config";

const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

server.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
