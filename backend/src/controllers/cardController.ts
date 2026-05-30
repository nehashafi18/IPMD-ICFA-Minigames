import fs from "fs";
import path from "path";
import { Request, Response, NextFunction } from "express";
import { parseCards } from "../services/cardService.js";

type JsonObject = {
  [key: string]: any;
};

function loadJson(pathname: string): JsonObject {
  const content = fs.readFileSync(pathname, "utf-8");

  if (!content.trim()) {
    throw new Error(`JSON file is empty: ${pathname}`);
  }

  return JSON.parse(content);
}

function filterMissingImages(cardsData: JsonObject): JsonObject {
  const cardsDir = path.join(process.cwd(), "../frontend/public/cards");

  function walk(obj: JsonObject): void {
    if (!obj || typeof obj !== "object") return;

    for (const key of Object.keys(obj)) {
      const value = obj[key];

      if (value && typeof value === "object" && value.display_name) {
        if (!value.image) {
          delete obj[key];
          continue;
        }

        const images = Array.isArray(value.image)
          ? value.image
          : [value.image];

        const validImages = images.filter((img: unknown) => {
          if (typeof img !== "string") return false;

          const filename = path.basename(img);
          const imagePath = path.join(cardsDir, filename);

          return fs.existsSync(imagePath);
        });

        if (validImages.length === 0) {
          console.log(`Removing card "${key}" because all images are missing`);
          delete obj[key];
        } else {
          value.image = validImages;
        }
      } else {
        walk(value as JsonObject);
      }
    }
  }

  walk(cardsData);

  return cardsData;
}

export function getCards(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    let styleData = loadJson(
      "./src/prompts/style_cards.json"
    );

    let emotionData = loadJson(
      "./src/prompts/emotion_cards.json"
    );

    let memoryData = loadJson(
      "./src/prompts/memory_cards.json"
    );

    let imaginationData = loadJson(
      "./src/prompts/imagination_cards.json"
    );

    let specialEffectData = loadJson(
      "./src/prompts/specialEffect_cards.json"
    );

    // remove cards with missing PNG
    styleData = filterMissingImages(styleData);

    emotionData = filterMissingImages(emotionData);

    memoryData = filterMissingImages(memoryData);

    imaginationData = filterMissingImages(
      imaginationData
    );

    specialEffectData = filterMissingImages(
      specialEffectData
    );

    res.json({
      style_cards: styleData.style_cards,
      emotion_cards: emotionData.emotion_cards,
      memory_cards: memoryData.memory_cards,
      imagination_cards:
        imaginationData.imagination_cards,
      specialEffect_cards:
        specialEffectData.specialEffect_cards,
    });
  } catch (error) {
    next(error);
  }
}

export function parseCardsController(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const parsedCards = parseCards(req.body);

    res.json({
      success: true,
      data: parsedCards
    });
  } catch (error) {
    next(error);
  }
}