import express, { Router } from "express";

import {
  getCards,
  parseCardsController
} from "../controllers/cardController.js";

const router: Router = express.Router();

router.get("/", getCards);

router.post("/parse", parseCardsController);

export default router;