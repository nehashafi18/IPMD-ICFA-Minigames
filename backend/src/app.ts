import express, {
  Application,
  Request,
  Response
} from "express";

import cors from "cors";
import fs from "node:fs";
import path from "node:path";

import cardRoutes      from "./routes/cardRoutes.js";
import promptRoutes    from "./routes/promptRoutes.js";
import artRoutes       from "./routes/artRoutes.js";
import detectiveRoutes from "./routes/detectiveRoutes.js";
import { config } from "./config.js";
import { requireGallerySession } from "./middleware/requireGallerySession.js";
import { vmsRouter } from "./vms/routes.js";

import { logger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app: Application = express();

app.set("trust proxy", true);

app.use(logger);

app.use(cors({
  origin: config.frontendOrigin,
  credentials: true
}));

app.use(express.json());

app.use("/api/vms", vmsRouter);

if (fs.existsSync(config.vmsAdminDistPath)) {
  app.use(
    "/vms-admin",
    express.static(config.vmsAdminDistPath)
  );

  app.get("/vms-admin/*", (_req: Request, res: Response) => {
    res.sendFile(path.join(config.vmsAdminDistPath, "index.html"));
  });
}

app.use("/api/cards", cardRoutes);

app.use("/api/prompt", promptRoutes);

app.use("/api/art",            artRoutes);
app.use("/api/art-detective",  detectiveRoutes);

app.use(errorHandler);

app.get(
  "/",
  (req: Request, res: Response) => {
    res.json({
      message: "Backend running"
    });
  }
);

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "backend",
    status: "healthy"
  });
});

export default app;
