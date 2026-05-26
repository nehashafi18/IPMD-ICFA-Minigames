import {
  Request,
  Response,
  NextFunction
} from "express";

import {
  buildPrompt
} from "../services/promptService.js";

interface BuildPromptRequestBody {
  [key: string]: any;
}

export async function buildPromptController(
  req: Request<{}, {}, BuildPromptRequestBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const promptResult = await buildPrompt({
      ...req.body,
      has_image: Boolean(req.file)
    });

    res.json({
      success: true,
      data: {
        prompt: promptResult.prompt,
        negative_prompt:
          promptResult.negative_prompt
      }
    });

  } catch (error) {
    next(error);
  }
}