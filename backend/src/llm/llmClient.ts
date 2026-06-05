import fs from "fs";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import path from "path";

import { AIProviderException } from "../utils/exceptions.js";

type LLMResponse = {
  prompt: string;
  negative_prompt: string;
};

type LLMConfig = {
  provider: string;
  model: string;
  temperature?: number;
  max_tokens?: number;
  timeout?: number;
  retry_attempts?: number;
  base_url?: string;
  deployment?: "local" | "docker" | "remote";
};

const gemmaConfig: LLMConfig = JSON.parse(
  fs.readFileSync(
    path.resolve("src/llm/gemma_config.json"),
    "utf-8"
  )
);

const qwenConfig: LLMConfig = JSON.parse(
  fs.readFileSync(
    path.resolve("src/llm/qwen_config.json"),
    "utf-8"
  )
);

function cleanJsonText(text: string): string {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function retry<T>(
  fn: () => Promise<T>,
  attempts: number
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function parseLLMJson(text: string): LLMResponse {
  return JSON.parse(cleanJsonText(text)) as LLMResponse;
}

async function generateWithRemoteGemma(
  llmInstruction: string
): Promise<LLMResponse> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  const response = await ai.models.generateContent({
    model: process.env.GEMMA_MODEL || gemmaConfig.model,
    contents: llmInstruction
  });

  return parseLLMJson(response.text ?? "");
}

async function generateWithLocalQwenServer(
  llmInstruction: string
): Promise<LLMResponse> {
  const response = await axios.post(
    process.env.QWEN_LOCAL_URL ||
      qwenConfig.base_url ||
      "http://localhost:8001/generate",
    {
      instruction: llmInstruction
    },
    {
      timeout: qwenConfig.timeout ?? 120000
    }
  );

  const content =
    response.data?.response ??
    response.data?.content ??
    "";

  return parseLLMJson(content);
}

async function generateWithLocalGemma(
  llmInstruction: string
): Promise<LLMResponse> {
  const response = await axios.post(
    process.env.GEMMA_BASE_URL ||
      gemmaConfig.base_url ||
      "http://localhost:11434/v1/chat/completions",
    {
      model: process.env.GEMMA_MODEL || gemmaConfig.model,
      messages: [
        {
          role: "user",
          content: llmInstruction
        }
      ],
      temperature: gemmaConfig.temperature ?? 0.7,
      max_tokens: gemmaConfig.max_tokens ?? 512
    },
    {
      timeout: gemmaConfig.timeout ?? 30000
    }
  );

  const content =
    response.data?.choices?.[0]?.message?.content ??
    response.data?.message?.content ??
    response.data?.response ??
    "";

  return parseLLMJson(content);
}

async function generateWithQwen(
  llmInstruction: string
): Promise<LLMResponse> {
  const qwen = new OpenAI({
    apiKey:
      process.env.QWEN_API_KEY ||
      "local-qwen",

    baseURL:
      process.env.QWEN_BASE_URL ||
      qwenConfig.base_url,

    timeout:
      qwenConfig.timeout ?? 120000,

    maxRetries:
      qwenConfig.retry_attempts ?? 2,
  });

  const response = await qwen.chat.completions.create({
    model: process.env.QWEN_MODEL || qwenConfig.model,
    messages: [
      {
        role: "user",
        content: llmInstruction,
      },
    ],
    temperature: qwenConfig.temperature ?? 0.7,
    max_tokens: qwenConfig.max_tokens ?? 512,
  });

  const content = response.choices[0]?.message?.content ?? "";

  return parseLLMJson(content);
}

export async function generatePromptWithLLM(
  llmInstruction: string
): Promise<LLMResponse> {
  const provider = process.env.LLM_PROVIDER || "gemma";

  if (provider === "gemma") {
    try {
      const attempts = gemmaConfig.retry_attempts ?? 3;

      return await retry(
        () => {
          const useLocalGemma =
            process.env.GEMMA_LOCAL === "true" ||
            gemmaConfig.deployment === "local" ||
            gemmaConfig.deployment === "docker";

          if (useLocalGemma) {
            return generateWithLocalGemma(llmInstruction);
          }

          return generateWithRemoteGemma(llmInstruction);
        },
        attempts
      );
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
      const attempts = qwenConfig.retry_attempts ?? 3;

      return await retry(
        () => {
          const deployment =
            process.env.QWEN_DEPLOYMENT || qwenConfig.deployment;

          if (
            deployment === "local" ||
            deployment === "docker" ||
            deployment === "remote"
          ) {
            console.log(
              "Using custom Qwen server:",
              process.env.QWEN_LOCAL_URL || qwenConfig.base_url
            );

            return generateWithLocalQwenServer(llmInstruction);
          }

          console.log(
            "Using OpenAI-compatible Qwen server:",
            process.env.QWEN_BASE_URL || qwenConfig.base_url
          );

          return generateWithQwen(llmInstruction);
        },
        attempts
      );
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