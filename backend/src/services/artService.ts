import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import path from "path";
import { InternalServerErrorException } from "../utils/exceptions.js";

function saveBase64ImageLocally(
  imageBase64: string,
  filename: string
): string {
  const outputDir = path.resolve("public/generated");
  fs.mkdirSync(outputDir, { recursive: true });

  const imageBuffer = Buffer.from(imageBase64, "base64");
  const localPath = path.join(outputDir, filename);

  fs.writeFileSync(localPath, imageBuffer);

  return `/generated/${filename}`;
}

async function downloadImageLocally(
  imageUrl: string,
  filename: string
): Promise<string> {
  const outputDir = path.resolve("public/generated");
  fs.mkdirSync(outputDir, { recursive: true });

  const localPath = path.join(outputDir, filename);

  const response = await axios.get(imageUrl, {
    responseType: "arraybuffer",
    timeout: 300000
  });

  fs.writeFileSync(localPath, response.data);

  return `/generated/${filename}`;
}

async function handleSDResponse(data: any): Promise<string> {
  const payload = data?.data || data;

  if (payload?.image_base64 && payload?.filename) {
    return saveBase64ImageLocally(
      payload.image_base64,
      payload.filename
    );
  }

  if (payload?.image_url && payload?.filename) {
    const baseUrl =
      process.env.SD_PUBLIC_BASE_URL ||
      "http://localhost:8000";

    return await downloadImageLocally(
      `${baseUrl}${payload.image_url}`,
      payload.filename
    );
  }

  throw new Error(
    `Missing image_url or image_base64 from SD response: ${JSON.stringify(data)}`
  );
}

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
        {
          headers: formData.getHeaders(),
          timeout: 300000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        }
      );

      console.log("SD raw response:", JSON.stringify(response.data, null, 2));

      return await handleSDResponse(response.data);
    }

    const response = await axios.post(
      process.env.SD_TXT2IMG_URL ||
        "http://localhost:8000/generate-text-to-image",
      {
        prompt,
        negative_prompt: negativePrompt || "",
        width,
        height
      },
      {
        timeout: 300000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );

    console.log("SD raw response:", JSON.stringify(response.data, null, 2));

    return await handleSDResponse(response.data);
  } catch (error: any) {
    console.error("SD generation error:", error.message);
    console.error("SD response:", error.response?.data);

    throw new InternalServerErrorException(
      "Stable Diffusion generation failed"
    );
  }
}