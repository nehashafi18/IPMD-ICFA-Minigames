// services/promptService.ts
import { generatePromptWithLLM } from "../llm/llmClient.js";

function weightedPrompt(text?: string, weight?: number): string | null {
  if (!text) return null;
  return `(${text}:${weight ?? 1})`;
}

export async function buildPrompt(body: any) {
  const {
    parsed_cards,
    subject = "",
    has_image = false,
    language = "en"
  } = body;

  const structuredPrompt = {
    mode: has_image
      ? "image_to_image"
      : subject.trim()
        ? "text_to_image"
        : "card_only",

    subject: subject.trim() || null,
    language,

    selected_hints: [
      weightedPrompt(
        parsed_cards.style?.prompt_hint,
        parsed_cards.category_weights.style
      ),
      weightedPrompt(
        parsed_cards.emotion?.prompt_hint,
        parsed_cards.category_weights.emotion
      ),
      weightedPrompt(
        parsed_cards.texture?.prompt_hint,
        parsed_cards.category_weights.texture
      ),
      weightedPrompt(
        parsed_cards.special_effect?.prompt_hint,
        parsed_cards.category_weights.special_effect
      )
    ].filter(Boolean),

    negative_prompt: [
      parsed_cards.style?.negative_prompt_hint,
      parsed_cards.emotion?.negative_prompt_hint,
      parsed_cards.texture?.negative_prompt_hint,
      parsed_cards.special_effect?.negative_prompt_hint
    ]
      .filter(Boolean)
      .join(", ")
  };

  const llmInstruction = `
You are an AI Stable Diffusion prompt generator.

Create one high-quality English prompt.

Rules:
- If mode is "image_to_image", treat the uploaded image as the subject.
- If mode is "text_to_image", use the subject text as the subject.
- If mode is "card_only", create an abstract image using only card hints.
- Do not mention card names.
- Return JSON only.

Input:
${JSON.stringify(structuredPrompt, null, 2)}

Return format:
{
  "prompt": "...",
  "negative_prompt": "..."
}
`;

  return await generatePromptWithLLM(llmInstruction);
}