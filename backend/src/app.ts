import express, {
  Application,
  Request,
  Response
} from "express";

import cors from "cors";

import cardRoutes from "./routes/cardRoutes.js";
import promptRoutes from "./routes/promptRoutes.js";

const app: Application = express();

app.use(cors());

app.use(express.json());

app.use("/api/cards", cardRoutes);

app.use("/api/prompts", promptRoutes);

app.get(
  "/",
  (req: Request, res: Response) => {
    res.json({
      message: "Backend running"
    });
  }
);

export default app;