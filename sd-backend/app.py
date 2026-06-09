from fastapi import FastAPI
from pydantic import BaseModel
import torch
from diffusers import StableDiffusionPipeline
import uuid
import os
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

MODEL_ID = "runwayml/stable-diffusion-v1-5"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
DTYPE = torch.float16 if torch.cuda.is_available() else torch.float32

pipe = None

class Txt2ImgRequest(BaseModel):
    prompt: str
    negative_prompt: str = "blurry, low quality, distorted"
    width: int = 512
    height: int = 512
    num_inference_steps: int = 10
    guidance_scale: float = 7.5

@app.get("/")
def root():
    return {
        "status": "ok",
        "device": DEVICE,
        "model_loaded": pipe is not None
    }

def get_pipe():
    global pipe

    if pipe is None:
        print(f"Loading Stable Diffusion model: {MODEL_ID}")
        print(f"Device: {DEVICE}")

        pipe = StableDiffusionPipeline.from_pretrained(
            MODEL_ID,
            torch_dtype=DTYPE,
        )

        pipe = pipe.to(DEVICE)
        pipe.enable_attention_slicing()

        print("Stable Diffusion loaded successfully")

    return pipe

@app.post("/generate-text-to-image")
def generate_text_to_image(req: Txt2ImgRequest):
    os.makedirs("outputs", exist_ok=True)

    model = get_pipe()

    image = model(
        prompt=req.prompt,
        negative_prompt=req.negative_prompt,
        width=req.width,
        height=req.height,
        num_inference_steps=req.num_inference_steps,
        guidance_scale=req.guidance_scale,
    ).images[0]

    filename = f"{uuid.uuid4()}.png"
    output_path = f"outputs/{filename}"
    image.save(output_path)

    return {
        "success": True,
        "filename": filename,
        "image_url": f"/outputs/{filename}"
    }