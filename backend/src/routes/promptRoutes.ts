import express, { Router } from "express";

import {
  buildPromptController
} from "../controllers/promptController.js";

const router: Router = express.Router();

router.post("/build", buildPromptController);

export default router;