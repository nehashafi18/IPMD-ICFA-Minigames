import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { AIProviderException } from "../utils/exceptions.js";

type LLMResponse = {
  prompt: string;
  negative_prompt: string;
};

function cleanJsonText(text: string): string {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function generatePromptWithLLM(
  llmInstruction: string
): Promise<LLMResponse> {
  const provider = process.env.LLM_PROVIDER || "gemma";

  if (provider === "gemma") {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing");
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      const response = await ai.models.generateContent({
        model:
          process.env.GEMMA_MODEL ||
          "gemma-4-26b-a4b-it",
        contents: llmInstruction,
      });

      return JSON.parse(
        cleanJsonText(response.text ?? "")
      ) as LLMResponse;
    } catch (error: unknown) {
      throw new AIProviderException(
        "gemma",
        503,
        "GemmaError",
        getErrorMessage(error)
      );
    }
  }

  if (provider === "qwen") {
    try {
      const qwen = new OpenAI({
        apiKey: process.env.QWEN_API_KEY,
        baseURL: process.env.QWEN_BASE_URL,
      });

      const response =
        await qwen.chat.completions.create({
          model: process.env.QWEN_MODEL || "qwen-plus",
          messages: [
            {
              role: "user",
              content: llmInstruction,
            },
          ],
          temperature: 0.7,
        });

      return JSON.parse(
        cleanJsonText(
          response.choices[0].message.content ?? ""
        )
      ) as LLMResponse;
    } catch (error: unknown) {
      throw new AIProviderException(
        "qwen",
        503,
        "QwenError",
        getErrorMessage(error)
      );
    }
  }

  throw new AIProviderException(
    provider,
    400,
    "UnsupportedProvider",
    `Unsupported LLM provider: ${provider}`
  );
}