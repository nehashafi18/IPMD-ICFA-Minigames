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

// frontend/public/cards
function filterMissingImages(cardsData: JsonObject): JsonObject {
  const cardsDir = path.join(
    process.cwd(),
    "../frontend/public/cards"
  );

  function walk(obj: JsonObject): void {
    if (!obj || typeof obj !== "object") {
      return;
    }

    for (const key of Object.keys(obj)) {
      const value = obj[key];

      // detect card object
      if (
        value &&
        typeof value === "object" &&
        value.display_name
      ) {
        // no image field
        if (!value.image) {
          delete obj[key];
          continue;
        }

        // image filename
        const filename = path.basename(value.image);

        // full image path
        const imagePath = path.join(cardsDir, filename);

        // remove missing-image cards
        if (!fs.existsSync(imagePath)) {
          console.log(
            `Removing card "${key}" because image missing`
          );

          delete obj[key];
        }
      } else {
        // recursive
        walk(value);
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

    // remove cards with missing PNG
    styleData = filterMissingImages(styleData);

    emotionData = filterMissingImages(emotionData);

    memoryData = filterMissingImages(memoryData);

    imaginationData = filterMissingImages(
      imaginationData
    );

    res.json({
      style_cards: styleData.style_cards,
      emotion_cards: emotionData.emotion_cards,
      memory_cards: memoryData.memory_cards,
      imagination_cards:
        imaginationData.imagination_cards,
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