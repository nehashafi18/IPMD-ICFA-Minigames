import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(__filename);

const REQUIRED_CARD_FIELDS = [
  "id",
  "display_name",
  "description",
  "image",
  "prompt_hints",
  "negative_prompt_hint"
];

function isNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim() !== "";
}

function isNonEmptyStringArray(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "string" && item.trim() !== "")
  );
}

function main() {
  console.log("Starting card validation...\n");

  const SRC_DIR = path.resolve(SCRIPT_DIR, "..");
  const CARDS_DIR = path.join(SRC_DIR, "prompts");

  console.log(`Looking for cards in: ${CARDS_DIR}\n`);

  if (!fs.existsSync(CARDS_DIR)) {
    console.error("Error: Cards directory does not exist.");
    process.exit(1);
  }

  const cardFiles = fs
    .readdirSync(CARDS_DIR)
    .filter((file) => file.endsWith("_cards.json"));

  if (cardFiles.length === 0) {
    console.error("No files ending in '_cards.json' were found.");
    process.exit(1);
  }

  const allIds = new Set<string>();
  let passed = true;
  let totalCards = 0;

  for (const filename of cardFiles) {
    const filepath = path.join(CARDS_DIR, filename);

    let fileData: unknown;

    try {
      fileData = JSON.parse(fs.readFileSync(filepath, "utf-8"));
    } catch (error) {
      console.error(`Error: JSON syntax error in ${filename}: ${String(error)}`);
      passed = false;
      continue;
    }

    if (!fileData || typeof fileData !== "object" || Array.isArray(fileData)) {
      console.error(`Error: ${filename} must contain a JSON object.`);
      passed = false;
      continue;
    }

    const fileObj = fileData as Record<string, unknown>;

    if (!isNonEmptyString(fileObj.category)) {
      console.error(`Error: ${filename} is missing or has invalid "category".`);
      passed = false;
    }

    if (typeof fileObj.category_weight !== "number") {
      console.error(`Error: ${filename} is missing or has invalid "category_weight".`);
      passed = false;
    }

    const categoryCards = fileObj["category cards"];

    if (
      !categoryCards ||
      typeof categoryCards !== "object" ||
      Array.isArray(categoryCards)
    ) {
      console.error(`Error: ${filename} is missing or has invalid "category cards".`);
      passed = false;
      continue;
    }

    for (const [cardKey, card] of Object.entries(
      categoryCards as Record<string, unknown>
    )) {
      totalCards++;

      if (!card || typeof card !== "object" || Array.isArray(card)) {
        console.error(`Error: Invalid card object in ${filename}: ${cardKey}`);
        passed = false;
        continue;
      }

      const cardObj = card as Record<string, unknown>;

      const cardId = isNonEmptyString(cardObj.id)
        ? String(cardObj.id)
        : `Unknown ID: ${cardKey}`;

      for (const field of REQUIRED_CARD_FIELDS) {
        if (!(field in cardObj)) {
          console.error(
            `Error: Missing field "${field}" in ${filename} (Card: ${cardId})`
          );
          passed = false;
        }
      }

      if (!isNonEmptyString(cardObj.id)) {
        console.error(`Error: Invalid "id" in ${filename} (Card: ${cardKey})`);
        passed = false;
      }

      if (!isNonEmptyString(cardObj.display_name)) {
        console.error(`Error: Invalid "display_name" in ${filename} (Card: ${cardId})`);
        passed = false;
      }

      if (!isNonEmptyString(cardObj.description)) {
        console.error(`Error: Invalid "description" in ${filename} (Card: ${cardId})`);
        passed = false;
      }

      if (!isNonEmptyStringArray(cardObj.image)) {
        console.error(`Error: "image" must be a non-empty string array in ${filename} (Card: ${cardId})`);
        passed = false;
      }

      if (!isNonEmptyStringArray(cardObj.prompt_hints)) {
        console.error(`Error: "prompt_hints" must be a non-empty string array in ${filename} (Card: ${cardId})`);
        passed = false;
      }

      if (!isNonEmptyStringArray(cardObj.negative_prompt_hint)) {
        console.error(`Error: "negative_prompt_hint" must be a non-empty string array in ${filename} (Card: ${cardId})`);
        passed = false;
      }

      if (isNonEmptyString(cardObj.id)) {
        const id = String(cardObj.id);

        if (allIds.has(id)) {
          console.error(`Error: Duplicate ID "${id}" found in ${filename}`);
          passed = false;
        } else {
          allIds.add(id);
        }
      }
    }
  }

  console.log("-".repeat(30));

  if (passed) {
    console.log(`Success! ${totalCards} cards validated. All IDs are unique.`);
    process.exit(0);
  } else {
    console.error("Validation failed. Please fix the errors above.");
    process.exit(1);
  }
}

main();