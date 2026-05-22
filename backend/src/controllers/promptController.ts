import { Request, Response, NextFunction } from "express";

import {
  buildPrompt,
  generateImageFromPrompt
} from "../services/promptService.js";

interface GeneratePromptRequestBody {
  width?: string | number;
  height?: string | number;
  [key: string]: any;
}

export async function generatePrompt(
  req: Request<{}, {}, GeneratePromptRequestBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const width = Number(req.body.width || 512);
    const height = Number(req.body.height || 512);

    const promptResult = await buildPrompt({
      ...req.body,
      has_image: Boolean(req.file)
    });

    const imageUrl = await generateImageFromPrompt(
      promptResult.prompt,
      promptResult.negative_prompt,
      req.file?.path || null,
      width,
      height
    );

    res.json({
      success: true,
      data: {
        prompt: promptResult.prompt,
        negative_prompt: promptResult.negative_prompt,
        width,
        height,
        image_url: imageUrl
      }
    });

  } catch (error) {
    next(error);
  }
}