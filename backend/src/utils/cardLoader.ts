import fs from "fs";
import path from "path";

const basePath = path.resolve("src/prompts");

type PromptCard = {
  prompt: string;
  [key: string]: any;
};

type PromptGroup = {
  [key: string]: PromptCard;
};

type PromptData = {
  [groupName: string]: PromptGroup;
};

function loadJson(fileName: string): PromptData {
  const filePath = path.join(
    basePath,
    `${fileName}.json`
  );

  return JSON.parse(
    fs.readFileSync(filePath, "utf-8")
  ) as PromptData;
}

export function getCardPrompt(
  groupName: string,
  cardId?: string
): string | null {
  if (!cardId) {
    return null;
  }

  const data = loadJson(groupName);

  const card =
    data[groupName]?.[cardId];

  if (!card) {
    throw new Error(
      `Card not found: ${cardId}`
    );
  }

  return card.prompt;
}