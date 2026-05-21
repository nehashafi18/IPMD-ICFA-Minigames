import fs from "fs";
import path from "path";

type JsonObject = {
  [key: string]: any;
};

export function filterMissingImages(
  categoryData: JsonObject
): JsonObject {

  const cardsDir = path.join(
    process.cwd(),
    "../frontend/public/cards"
  );

  // recursively walk objects
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
        "display_name" in value
      ) {

        // no image field
        if (!value.image) {
          delete obj[key];
          continue;
        }

        // image filename only
        const filename = path.basename(
          value.image
        );

        const fullPath = path.join(
          cardsDir,
          filename
        );

        // remove card if image missing
        if (!fs.existsSync(fullPath)) {

          console.log(
            `Removing card "${key}" - missing image`
          );

          delete obj[key];
        }

      } else {

        // recursive
        walk(value);
      }
    }
  }

  walk(categoryData);

  return categoryData;
}