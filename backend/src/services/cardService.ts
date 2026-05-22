// services/cardService.ts
import fs from "fs";
import {
  InvalidException,
  InternalServerErrorException
} from "../utils/exceptions.js";

let styleData: any;
let emotionData: any;
let textureData: any;
let specialEffectData: any;

try {
  styleData = JSON.parse(fs.readFileSync("./src/prompts/style_cards.json", "utf-8"));
  emotionData = JSON.parse(fs.readFileSync("./src/prompts/emotion_cards.json", "utf-8"));
  textureData = JSON.parse(fs.readFileSync("./src/prompts/texture_cards.json", "utf-8"));
  specialEffectData = JSON.parse(fs.readFileSync("./src/prompts/special_effect_cards.json", "utf-8"));
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
    texture: getCardPrompt(textureData, "texture_cards", body.texture_card),
    special_effect: getCardPrompt(
      specialEffectData,
      "special_effect_cards",
      body.special_effect_card
    ),
    category_weights: {
      style: styleData.category_weight,
      emotion: emotionData.category_weight,
      texture: textureData.category_weight,
      special_effect: specialEffectData.category_weight
    }
  };
}