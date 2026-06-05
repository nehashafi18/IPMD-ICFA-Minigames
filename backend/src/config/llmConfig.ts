export const llmConfig = {
  provider: process.env.LLM_PROVIDER ?? "qwen",

  qwen: {
    apiKey: process.env.QWEN_API_KEY ?? "local-qwen",

    baseUrl:
      process.env.QWEN_BASE_URL ??
      "http://qwen-local:8001/v1",

    model:
      process.env.QWEN_MODEL ??
      "Qwen/Qwen2.5-1.5B-Instruct",

    temperature: Number(process.env.QWEN_TEMPERATURE ?? 0.7),

    maxTokens: Number(process.env.QWEN_MAX_TOKENS ?? 512),

    timeout: Number(process.env.QWEN_TIMEOUT ?? 120000),

    retryAttempts: Number(process.env.QWEN_RETRY_ATTEMPTS ?? 2),
  },
};