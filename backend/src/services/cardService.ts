import fs from "fs";
import {
  InvalidException,
  InternalServerErrorException
} from "../utils/exceptions.js";

let styleData: any;
let emotionData: any;
let memoryData: any;
let imaginationData: any;

try {
  styleData = JSON.parse(fs.readFileSync("./src/prompts/style_cards.json", "utf-8"));
  emotionData = JSON.parse(fs.readFileSync("./src/prompts/emotion_cards.json", "utf-8"));
  memoryData = JSON.parse(fs.readFileSync("./src/prompts/memory_cards.json", "utf-8"));
  imaginationData = JSON.parse(fs.readFileSync("./src/prompts/imagination_cards.json", "utf-8"));
} catch {
  throw new InternalServerErrorException("Failed to load prompt JSON files");
}

function pickRandom(list?: string[]): string | null {
  if (!Array.isArray(list) || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
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
    prompt_hint: pickRandom(card.prompt_hints),
    negative_prompt_hint: pickRandom(card.negative_prompt_hints)
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
    category_weights: {
      style: styleData.category_weight,
      emotion: emotionData.category_weight,
      memory: memoryData.category_weight,
      imagination: imaginationData.category_weight
    }
  };
}