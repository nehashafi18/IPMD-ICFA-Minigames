import { Request, Response, NextFunction } from "express";
import { generateImageFromPrompt } from "../services/artService.js";

export async function generateArtController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      prompt,
      negative_prompt = "",
      width = 512,
      height = 512
    } = req.body;

    const imageUrl = await generateImageFromPrompt(
      prompt,
      negative_prompt,
      req.file?.path || null,
      Number(width),
      Number(height)
    );

    res.json({
      success: true,
      data: {
        image_url: imageUrl
      }
    });
  } catch (error) {
    next(error);
  }
}