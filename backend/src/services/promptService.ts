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

    prompt_parts: {
      memory: weightedPrompt(
        parsed_cards.memory?.prompt_hint,
        parsed_cards.category_weights?.memory
      ),

      emotion: weightedPrompt(
        parsed_cards.emotion?.prompt_hint,
        parsed_cards.category_weights?.emotion
      ),

      imagination: weightedPrompt(
        parsed_cards.imagination?.prompt_hint,
        parsed_cards.category_weights?.imagination
      ),

      style: weightedPrompt(
        parsed_cards.style?.prompt_hint,
        parsed_cards.category_weights?.style
      ),

      specialEffect: weightedPrompt(
        parsed_cards.specialEffect?.prompt_hint,
        parsed_cards.category_weights?.specialEffect
      ),
    },

    raw_cards: {
      memory_type: parsed_cards.memory?.display_name || null,
      emotion_type: parsed_cards.emotion?.display_name || null,
      imagination_type: parsed_cards.imagination?.display_name || null,
      style_type: parsed_cards.style?.display_name || null,
      specialEffect_type: parsed_cards.specialEffect?.display_name || null,
    },

    negative_prompt: [
      parsed_cards.memory?.negative_prompt_hint,
      parsed_cards.emotion?.negative_prompt_hint,
      parsed_cards.imagination?.negative_prompt_hint,
      parsed_cards.style?.negative_prompt_hint,
      parsed_cards.specialEffect?.negative_prompt_hint,
    ]
      .filter(Boolean)
      .join(", ")
  };

  const systemPrompt = `
You are an expert AI prompt engineer for Stable Diffusion 1.5.

Your job is to generate short, beautiful, emotionally rich image prompts.

Rules:
- Keep the prompt under 75 words.
- Use strong nouns and clear visual descriptors.
- Use short phrases, not long paragraphs.
- Always include subject, emotion or mood, art style, lighting, and color palette.
- Memory should define the main scene or remembered place.
- Emotion should define the mood and atmosphere.
- Imagination should add dreamlike, symbolic, or surreal details.
- Style should define the final artistic rendering.
- SpecialEffect should add visual effects such as glow, particles, sparkles, motion blur, mist, magical light, or cinematic effects.
- If mode is "image_to_image", treat the uploaded image as the subject and apply the card effects to transform it.
- If mode is "text_to_image", use the subject text as the main subject.
- If mode is "card_only", create an abstract fine-art image using only the card prompt parts.
- Do not mention card names.
- Do not include markdown.
- Do not include explanations.
- Output valid JSON only.
`;

  const userPrompt = `
Generate a Stable Diffusion 1.5 prompt using this structured input:

${JSON.stringify(structuredPrompt, null, 2)}

Return only this JSON format:
{
  "prompt": "...",
  "negative_prompt": "..."
}

Prompt requirements:
- The prompt must be SD-compatible.
- The prompt must be visually descriptive.
- The prompt must be concise.
- The prompt must feel artistic and emotionally rich.
- The negative_prompt must combine the provided negative prompt hints.
`;

  const llmInstruction = `
${systemPrompt.trim()}

${userPrompt.trim()}
`;

  return await generatePromptWithLLM(llmInstruction);
}