import express, { Router } from "express";
import { getCards } from "../controllers/cardController.js";

const router: Router = express.Router();

router.get("/", getCards);

export default router;