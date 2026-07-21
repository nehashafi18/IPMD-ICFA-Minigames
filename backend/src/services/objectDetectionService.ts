/**
 * Object detection via Gemini vision.
 *
 * The SD image has hidden objects CAMOUFLAGED naturally within the scene.
 * Gemini is instructed to search carefully for them, not just spot obvious things.
 *
 * Returns normalized bounding boxes (fractions 0–1 of image dimensions).
 * The calling service converts these to pixel coordinates.
 */

import fs              from 'fs';
import { GoogleGenAI } from '@google/genai';

export interface DetectedObject {
  object_id:      string;          // e.g. "orange_butterfly_1"
  label:          string;
  x:              number;          // left edge, fraction of image width  (0–1)
  y:              number;          // top  edge, fraction of image height (0–1)
  width:          number;          // fraction of image width
  height:         number;          // fraction of image height
  category:       'target' | 'distractor' | 'environment';
  saliency_score: number;          // 0 (very hidden) – 1 (obvious)
}

export interface DetectionRequest {
  imagePath:        string;
  targetLabel:      string;
  distractorLabels: string[];
}

const VISION_PROMPT = (target: string, distractors: string[]) => `
You are analyzing a hidden-object game scene. The objects you are looking for are DELIBERATELY CAMOUFLAGED — they blend naturally into their surroundings. Look carefully and search the ENTIRE image.

Find ALL instances of:
  HIDDEN TARGET objects  : ${target}  (camouflaged, may blend with background)
  DISTRACTOR objects     : ${distractors.join(', ')}  (more obvious, not the goal)

Search every area of the image systematically. Targets may be:
- Partially hidden behind other objects
- Colour-matched to their surroundings
- Small or tucked into texture
- Easy to overlook on first glance

Return ONLY a valid JSON array (no markdown, no commentary):
[
  {
    "object_id":      "snake_case_label_N",
    "label":          "human readable name",
    "x":              0.0,
    "y":              0.0,
    "width":          0.0,
    "height":         0.0,
    "category":       "target",
    "saliency_score": 0.3
  }
]

Rules:
- x, y, width, height are fractions 0.0–1.0 of image dimensions
- Bounding boxes tightly enclose the visible object
- category MUST be "target" for ${target} objects, "distractor" for the others
- saliency_score: how obvious the object is (0 = very hidden, 1 = very obvious)
- If genuinely cannot find a target, omit it — do not guess
- Return [] if nothing is found
`.trim();

export async function detectObjects(req: DetectionRequest): Promise<DetectedObject[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[objectDetection] GEMINI_API_KEY not set — skipping vision analysis');
    return [];
  }

  let base64Image: string;
  try {
    base64Image = fs.readFileSync(req.imagePath).toString('base64');
  } catch (err) {
    console.error('[objectDetection] Cannot read image:', err);
    return [];
  }

  const ai     = new GoogleGenAI({ apiKey });
  const prompt = VISION_PROMPT(req.targetLabel, req.distractorLabels);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
            { text: prompt },
          ],
        },
      ],
    });

    const text       = response.text ?? '';
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (!arrayMatch) {
      console.warn('[objectDetection] No JSON array in Gemini response:', text.slice(0, 300));
      return [];
    }

    const raw = JSON.parse(arrayMatch[0]) as DetectedObject[];
    return raw.map((o) => ({
      ...o,
      x:      Math.max(0, Math.min(1,    o.x)),
      y:      Math.max(0, Math.min(1,    o.y)),
      width:  Math.max(0.01, Math.min(1, o.width)),
      height: Math.max(0.01, Math.min(1, o.height)),
    }));
  } catch (err) {
    console.error('[objectDetection] Gemini call failed:', err);
    return [];
  }
}
