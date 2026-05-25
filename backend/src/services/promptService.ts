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
      )
    },

    negative_prompt: [
      parsed_cards.memory?.negative_prompt_hint,
      parsed_cards.emotion?.negative_prompt_hint,
      parsed_cards.imagination?.negative_prompt_hint,
      parsed_cards.style?.negative_prompt_hint
    ]
      .filter(Boolean)
      .join(", ")
  };

  const llmInstruction = `
You are an AI Stable Diffusion prompt generator.

Create one high-quality English prompt by combining:
1. Memory = main scene or remembered place
2. Emotion = emotional tone
3. Imagination = surreal or creative elements
4. Style = visual rendering style

Combination logic:
- Memory should define the main scene.
- Emotion should describe the mood or atmosphere.
- Imagination should add dreamlike, symbolic, or surreal details.
- Style should describe the final artistic rendering.
- If mode is "image_to_image", treat the uploaded image as the subject and apply the four prompt parts to transform it.
- If mode is "text_to_image", use the subject text as the main subject.
- If mode is "card_only", create an abstract image using only the prompt parts.
- Do not mention card names.
- Return JSON only.

Input:
${JSON.stringify(structuredPrompt, null, 2)}

Return format:
{
  "prompt": "...",
  "negative_prompt": "..."
}

Example style of final prompt:
"A quiet seaside memory at dusk with gentle waves, expressed in a soft, melancholic tone. Floating light particles drift through the scene beneath an oversized moon, creating a dreamlike surreal atmosphere. Rendered in soft watercolor memorys with diffused edges."
`;

  return await generatePromptWithLLM(llmInstruction);
}