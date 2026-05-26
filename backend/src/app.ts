import express, {
  Application,
  Request,
  Response
} from "express";

import cors from "cors";

import cardRoutes from "./routes/cardRoutes.js";
import promptRoutes from "./routes/promptRoutes.js";
import artRoutes from "./routes/artRoutes.js";

import { logger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app: Application = express();

app.use(logger);

app.use(cors());

app.use(express.json());

app.use("/api/cards", cardRoutes);

app.use("/api/prompt", promptRoutes);

app.use("/api/art", artRoutes);

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