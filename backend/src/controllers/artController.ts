import { Request, Response, NextFunction } from "express";
import { generateImageFromPrompt } from "../services/artService.js";
import { buildPrompt } from "../services/promptService.js";
import { parseCards } from "../services/cardService.js";

export async function generateArtController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let {
      prompt,
      negative_prompt = "",
      subject = "",
      width = 512,
      height = 512
    } = req.body;

    if (!prompt) {
      const parsed_cards = parseCards({
        emotion: req.body.emotion,
        memory: req.body.memory,
        imagination: req.body.imagination,
        style: req.body.style,
        specialEffect: req.body.specialEffect
      });

      const promptResult = await buildPrompt({
        subject,
        parsed_cards,
        has_image: Boolean(req.file)
      });

      prompt = promptResult.prompt;
      negative_prompt = promptResult.negative_prompt;
    }

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
        prompt,
        negative_prompt,
        image_url: imageUrl
      }
    });
  } catch (error) {
    next(error);
  }
}