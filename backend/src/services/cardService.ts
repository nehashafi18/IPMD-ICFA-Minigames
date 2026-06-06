import fs from "fs";
import {
  InvalidException,
  InternalServerErrorException
} from "../utils/exceptions.js";

let styleData: any;
let emotionData: any;
let memoryData: any;
let imaginationData: any;
let specialEffectData: any;

try {
  const files = [
    "./src/prompts/style_cards.json",
    "./src/prompts/emotion_cards.json",
    "./src/prompts/memory_cards.json",
    "./src/prompts/imagination_cards.json",
    "./src/prompts/specialEffect_cards.json"
  ].map((pathname) =>
    JSON.parse(fs.readFileSync(pathname, "utf-8"))
  );

  const findGroup = (groupName: string) => {
    const data = files.find((file) => file[groupName]);

    if (!data) {
      throw new Error(`Prompt group not found: ${groupName}`);
    }

    return data;
  };

  styleData = findGroup("style_cards");
  emotionData = findGroup("emotion_cards");
  memoryData = findGroup("memory_cards");
  imaginationData = findGroup("imagination_cards");
  specialEffectData = findGroup("specialEffect_cards");
} catch {
  throw new InternalServerErrorException("Failed to load prompt JSON files");
}

function pickRandom(value?: string | string[]): string | null {
  if (!value) return null;

  if (typeof value === "string") {
    return value;
  }

  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  return value[Math.floor(Math.random() * value.length)];
}

function getCardPrompt(data: any, groupName: string, cardId?: string) {
  if (!cardId) return null;

  const cards = data[groupName];

  if (!cards) {
    throw new InvalidException(`Group "${groupName}" not found`);
  }

  const card = cards[cardId];

  if (!card) {
    throw new InvalidException(`Invalid card id: ${cardId}`);
  }

  return {
    ...card,
    prompt_hint: pickRandom(card.prompt_hints ?? card.prompt_hint),
    negative_prompt_hint: pickRandom(
      card.negative_prompt_hints ?? card.negative_prompt_hint
    )
  };
}

export function parseCards(body: any) {
  return {
    style: getCardPrompt(styleData, "style_cards", body.style_card),
    emotion: getCardPrompt(emotionData, "emotion_cards", body.emotion_card),
    memory: getCardPrompt(memoryData, "memory_cards", body.memory_card),
    imagination: getCardPrompt(
      imaginationData,
      "imagination_cards",
      body.imagination_card
    ),
    specialEffect: getCardPrompt(
      specialEffectData,
      "specialEffect_cards",
      body.specialEffect_card
    ),
    category_weights: {
      style: styleData.category_weight,
      emotion: emotionData.category_weight,
      memory: memoryData.category_weight,
      imagination: imaginationData.category_weight,
      specialEffect: specialEffectData.category_weight
    }
  };
}
