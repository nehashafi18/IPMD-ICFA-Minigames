from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import torch
from diffusers import (
    StableDiffusionPipeline,
    DPMSolverMultistepScheduler,
    EulerAncestralDiscreteScheduler,
    EulerDiscreteScheduler,
    DDIMScheduler,
)
from PIL import Image
import uuid
import os
from fastapi.staticfiles import StaticFiles

app = FastAPI()
os.makedirs("outputs", exist_ok=True)
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

MODEL_ID = "runwayml/stable-diffusion-v1-5"

if torch.cuda.is_available():
    DEVICE = "cuda"
    DTYPE  = torch.float16
elif torch.backends.mps.is_available():
    DEVICE = "mps"
    DTYPE  = torch.float32
else:
    DEVICE = "cpu"
    DTYPE  = torch.float32

print(f"[SD] device={DEVICE}  dtype={DTYPE}  model={MODEL_ID}")

pipe = None


class Txt2ImgRequest(BaseModel):
    prompt:          str
    negative_prompt: str     = (
        "blurry, low resolution, noisy, distorted objects, extra limbs, "
        "text artifacts, watermark, low quality, pixelated, grainy, deformed"
    )
    width:           int     = 512
    height:          int     = 512
    steps:           int     = 40
    cfg_scale:       float   = 7.0
    sampler:         str     = "DPM++ 2M Karras"
    upscale_factor:  int     = 2
    seed:            int     = -1   # -1 = random; >=0 = fixed seed


@app.get("/")
def root():
    return {
        "status":       "ok",
        "device":       DEVICE,
        "model":        MODEL_ID,
        "model_loaded": pipe is not None,
    }


def _apply_sampler(p, sampler: str):
    name = sampler.strip().lower()
    cfg  = p.scheduler.config
    if "dpm++ 2m karras" in name or "dpm++2m karras" in name:
        p.scheduler = DPMSolverMultistepScheduler.from_config(
            cfg, algorithm_type="dpmsolver++", use_karras_sigmas=True,
        )
    elif "euler a" in name or "euler ancestral" in name:
        p.scheduler = EulerAncestralDiscreteScheduler.from_config(cfg)
    elif "euler" in name:
        p.scheduler = EulerDiscreteScheduler.from_config(cfg)
    elif "ddim" in name:
        p.scheduler = DDIMScheduler.from_config(cfg)


def get_pipe():
    global pipe
    if pipe is None:
        print(f"[SD] Loading {MODEL_ID} on {DEVICE}...")
        pipe = StableDiffusionPipeline.from_pretrained(
            MODEL_ID,
            torch_dtype=DTYPE,
            safety_checker=None,
            requires_safety_checker=False,
        ).to(DEVICE)
        pipe.scheduler = DPMSolverMultistepScheduler.from_config(
            pipe.scheduler.config,
            algorithm_type="dpmsolver++",
            use_karras_sigmas=True,
        )
        if hasattr(pipe, "enable_attention_slicing"):
            pipe.enable_attention_slicing()
        print("[SD] Model loaded.")
    return pipe


@app.post("/generate-text-to-image")
def generate_text_to_image(req: Txt2ImgRequest):
    os.makedirs("outputs", exist_ok=True)
    model = get_pipe()
    _apply_sampler(model, req.sampler)

    # Fixed seed uses CPU generator for cross-device reproducibility
    generator: Optional[torch.Generator] = None
    if req.seed >= 0:
        generator = torch.Generator('cpu').manual_seed(req.seed)
        print(f"[SD] seed={req.seed}")

    result = model(
        prompt=req.prompt,
        negative_prompt=req.negative_prompt,
        width=req.width,
        height=req.height,
        num_inference_steps=req.steps,
        guidance_scale=req.cfg_scale,
        generator=generator,
    )
    image: Image.Image = result.images[0]

    if req.upscale_factor > 1:
        image = image.resize(
            (image.width * req.upscale_factor, image.height * req.upscale_factor),
            Image.LANCZOS,
        )

    filename    = f"{uuid.uuid4()}.jpg"
    output_path = f"outputs/{filename}"
    image.save(output_path, "JPEG", quality=95, optimize=True)

    return {
        "success":   True,
        "filename":  filename,
        "image_url": f"/outputs/{filename}",
        "width":     image.width,
        "height":    image.height,
    }
