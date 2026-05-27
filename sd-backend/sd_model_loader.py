import os
import torch
from dotenv import load_dotenv
from huggingface_hub import login
from diffusers import StableDiffusionPipeline, StableDiffusionImg2ImgPipeline

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
MODEL_ID = os.getenv("SD_MODEL_ID", "runwayml/stable-diffusion-v1-5")

if HF_TOKEN:
    login(token=HF_TOKEN)

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
DTYPE = torch.float16 if torch.cuda.is_available() else torch.float32

print(f"Loading Stable Diffusion model: {MODEL_ID}")
print(f"Device: {DEVICE}")

txt2img_pipe = StableDiffusionPipeline.from_pretrained(
    MODEL_ID,
    torch_dtype=DTYPE,
    safety_checker=None,
    requires_safety_checker=False
).to(DEVICE)

img2img_pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
    MODEL_ID,
    torch_dtype=DTYPE,
    safety_checker=None,
    requires_safety_checker=False
).to(DEVICE)

txt2img_pipe.enable_attention_slicing()
img2img_pipe.enable_attention_slicing()

print("Stable Diffusion pipelines loaded successfully.")