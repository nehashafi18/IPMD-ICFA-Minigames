import fs from "fs";
import axios, { AxiosError } from "axios";
import FormData from "form-data";

import { generatePromptWithLLM } from "./llmService.js";

import {
  BadRequestException,
  InvalidException,
  InternalServerErrorException
} from "../utils/exceptions.js";

type CardData = {
  category_weight?: number;
  [key: string]: any;
};

type Card = {
  prompt_hints?: string[];
  negative_prompt_hints?: string[];
  [key: string]: any;
};

type PromptResult = {
  prompt: string;
  negative_prompt?: string;
};

const SD_API_URL =
  process.env.SD_API_URL ||
  "http://localhost:8000/generate-image-to-image";

let styleData: CardData;
let emotionData: CardData;
let textureData: CardData;
let specialEffectData: CardData;

try {
  styleData = JSON.parse(
    fs.readFileSync(
      "./src/prompts/style_cards.json",
      "utf-8"
    )
  );

  emotionData = JSON.parse(
    fs.readFileSync(
      "./src/prompts/emotion_cards.json",
      "utf-8"
    )
  );

  textureData = JSON.parse(
    fs.readFileSync(
      "./src/prompts/texture_cards.json",
      "utf-8"
    )
  );

  specialEffectData = JSON.parse(
    fs.readFileSync(
      "./src/prompts/special_effect_cards.json",
      "utf-8"
    )
  );

} catch {
  throw new InternalServerErrorException(
    "Failed to load prompt JSON files"
  );
}

function pickRandom(
  list?: string[]
): string | null {
  if (!Array.isArray(list) || list.length === 0) {
    return null;
  }

  return list[
    Math.floor(Math.random() * list.length)
  ];
}

function getCardPrompt(
  categoryData: CardData,
  groupName: string,
  cardId?: string
): Card | null {
  if (!cardId) {
    return null;
  }

  const cards = categoryData?.[groupName];

  if (!cards) {
    throw new InvalidException(
      `Group "${groupName}" not found`
    );
  }

  const card = cards[cardId];

  if (!card) {
    console.log(
      "Available cards:",
      Object.keys(cards)
    );

    throw new InvalidException(
      `Invalid card id: ${cardId}`
    );
  }

  return {
    ...card,
    prompt_hint: pickRandom(card.prompt_hints),
    negative_prompt_hint: pickRandom(
      card.negative_prompt_hints
    )
  };
}

function weightedPrompt(
  text?: string | null,
  weight?: number
): string | null {
  if (!text) {
    return null;
  }

  return `(${text}:${weight ?? 1})`;
}

function validateImageSize(
  width: number,
  height: number
): void {
  const allowedSizes = [
    "256x256",
    "384x384",
    "512x512",
    "512x768",
    "768x512"
  ];

  const size = `${width}x${height}`;

  if (!allowedSizes.includes(size)) {
    throw new BadRequestException(
      "Invalid image size. Allowed: 256x256, 384x384, 512x512, 512x768, 768x512"
    );
  }
}

type BuildPromptBody = {
  emotion_card?: string;
  style_card?: string;
  texture_card?: string;
  special_effect_card?: string;
  subject?: string;
  has_image?: boolean;
  language?: string;
  width?: number | string;
  height?: number | string;
};

export async function buildPrompt(
  body: BuildPromptBody
): Promise<PromptResult> {
  const {
    emotion_card,
    style_card,
    texture_card,
    special_effect_card,
    subject = "",
    has_image = false,
    language = "en",
    width = 512,
    height = 512
  } = body;

  validateImageSize(
    Number(width),
    Number(height)
  );

  const emotion = getCardPrompt(
    emotionData,
    "emotion_cards",
    emotion_card
  );

  const style = getCardPrompt(
    styleData,
    "style_cards",
    style_card
  );

  const texture = getCardPrompt(
    textureData,
    "texture_cards",
    texture_card
  );

  const specialEffect = getCardPrompt(
    specialEffectData,
    "special_effect_cards",
    special_effect_card
  );

  const structuredPrompt = {
    mode: has_image
      ? "image_to_image"
      : subject.trim()
        ? "text_to_image"
        : "card_only",

    subject: subject.trim() || null,

    language,

    selected_hints: [
      weightedPrompt(
        style?.prompt_hint,
        styleData.category_weight
      ),

      weightedPrompt(
        emotion?.prompt_hint,
        emotionData.category_weight
      ),

      weightedPrompt(
        texture?.prompt_hint,
        textureData.category_weight
      ),

      weightedPrompt(
        specialEffect?.prompt_hint,
        specialEffectData.category_weight
      )
    ].filter(Boolean),

    negative_prompt: [
      style?.negative_prompt_hint,
      emotion?.negative_prompt_hint,
      texture?.negative_prompt_hint,
      specialEffect?.negative_prompt_hint
    ]
      .filter(Boolean)
      .join(", ")
  };

  const llmInstruction = `
You are an AI Stable Diffusion prompt generator.

Create one high-quality English prompt.

Rules:
- If mode is "image_to_image", treat the uploaded image as the subject.
- If mode is "text_to_image", use the subject text as the subject.
- If mode is "card_only", create an abstract or general image prompt using only the card hints.
- Do not mention card names.
- Preserve uploaded image content only in image_to_image mode.
- Keep the prompt visual and concise.
- Return JSON only.

Input:
${JSON.stringify(structuredPrompt, null, 2)}

Return format:
{
  "prompt": "...",
  "negative_prompt": "..."
}
`;

  return await generatePromptWithLLM(
    llmInstruction
  );
}

export async function generateImageFromPrompt(
  prompt: string,
  negativePrompt: string,
  imagePath: string | null,
  width: number = 512,
  height: number = 512
): Promise<string> {
  validateImageSize(
    Number(width),
    Number(height)
  );

  try {
    if (imagePath) {
      const formData = new FormData();

      formData.append("prompt", prompt);

      formData.append(
        "negative_prompt",
        negativePrompt || ""
      );

      formData.append(
        "width",
        String(width)
      );

      formData.append(
        "height",
        String(height)
      );

      formData.append(
        "image",
        fs.createReadStream(imagePath)
      );

      const response = await axios.post(
        process.env.SD_IMG2IMG_URL ||
          "http://localhost:8000/generate-image-to-image",
        formData,
        {
          headers: formData.getHeaders()
        }
      );

      return response.data.image_url;
    }

    const response = await axios.post(
      process.env.SD_TXT2IMG_URL ||
        "http://localhost:8000/generate-text-to-image",
      {
        prompt,
        negative_prompt:
          negativePrompt || "",
        width,
        height
      }
    );

    return response.data.image_url;

  } catch (error) {
    const axiosError =
      error as AxiosError<any>;

    throw new InternalServerErrorException(
      axiosError.response?.data?.detail ||
        "Stable Diffusion generation failed"
    );
  }
}