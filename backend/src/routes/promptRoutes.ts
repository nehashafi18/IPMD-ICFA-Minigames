import express, { Router } from "express";
import multer from "multer";

import { generatePrompt } from "../controllers/promptController.js";

const router: Router = express.Router();

const upload = multer({
  dest: "uploads/"
});

router.post(
  "/generate",
  upload.single("image"),
  generatePrompt
);

export default router;