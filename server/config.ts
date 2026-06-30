import path from "node:path";

const parsedPort = Number(process.env.PORT ?? process.env.API_PORT);

export const PORT = Number.isFinite(parsedPort) ? parsedPort : 3001;
export const clientDistPath = path.resolve(process.cwd(), "dist");
export const clientIndexPath = path.join(clientDistPath, "index.html");
