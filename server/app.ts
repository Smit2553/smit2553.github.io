import express from "express";
import path from "node:path";
import adminRouter from "./routes/admin";
import { clientDistPath, clientIndexPath } from "./config";

export const app = express();

app.use(express.json({ limit: "32kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/admin", adminRouter);

app.use(express.static(clientDistPath));

app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return next();
  }

  if (req.path === "/api" || req.path.startsWith("/api/")) {
    return next();
  }

  if (path.extname(req.path)) {
    return next();
  }

  // Only rewrite extensionless routes so missing assets still return 404s.
  res.sendFile(clientIndexPath, (error) => {
    if (error) {
      next(error);
    }
  });
});
