import express, { Router } from "express";
import multer from "multer";

import { generateArtController } from "../controllers/artController.js";

const router: Router = express.Router();

const upload = multer({
  dest: "uploads/"
});

router.post(
  "/generate",
  upload.single("image"),
  generateArtController
);

export default router;