import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import { InternalServerErrorException } from "../utils/exceptions.js";

export async function generateImageFromPrompt(
  prompt: string,
  negativePrompt: string,
  imagePath: string | null,
  width = 512,
  height = 512
): Promise<string> {
  try {
    if (imagePath) {
      const formData = new FormData();

      formData.append("prompt", prompt);
      formData.append("negative_prompt", negativePrompt || "");
      formData.append("width", String(width));
      formData.append("height", String(height));
      formData.append("image", fs.createReadStream(imagePath));

      const response = await axios.post(
        process.env.SD_IMG2IMG_URL ||
          "http://localhost:8000/generate-image-to-image",
        formData,
        { headers: formData.getHeaders() }
      );

      return response.data.image_url;
    }

    const response = await axios.post(
      process.env.SD_TXT2IMG_URL ||
        "http://localhost:8000/generate-text-to-image",
      {
        prompt,
        negative_prompt: negativePrompt || "",
        width,
        height
      }
    );

    return response.data.image_url;
  } catch {
    throw new InternalServerErrorException(
      "Stable Diffusion generation failed"
    );
  }
}