from diffusers import StableDiffusionImg2ImgPipeline, StableDiffusionPipeline
import torch
from PIL import Image
import os
import uuid
from dotenv import load_dotenv
from huggingface_hub import login

load_dotenv()

hf_token = os.getenv("HF_TOKEN")

if hf_token:
    login(token=hf_token)

model_id = "runwayml/stable-diffusion-v1-5"

device = "cuda" if torch.cuda.is_available() else "cpu"
dtype = torch.float16 if torch.cuda.is_available() else torch.float32

print(f"Loading Stable Diffusion 1.5 on {device}...")

txt2img_pipe = StableDiffusionPipeline.from_pretrained(
    model_id,
    torch_dtype=dtype,
    safety_checker=None,
    requires_safety_checker=False
).to(device)

img2img_pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
    model_id,
    torch_dtype=dtype,
    safety_checker=None,
    requires_safety_checker=False
).to(device)

txt2img_pipe.enable_attention_slicing()
img2img_pipe.enable_attention_slicing()

print("Stable Diffusion pipelines ready!")


def save_image(image):
    os.makedirs("outputs", exist_ok=True)

    filename = f"{uuid.uuid4()}.png"
    path = f"outputs/{filename}"

    image.save(path)

    return path


def generate_text_to_image(
    prompt,
    negative_prompt="",
    width=512,
    height=512
):
    result = txt2img_pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        width=width,
        height=height,
        num_inference_steps=25,
        guidance_scale=7.5
    ).images[0]

    return save_image(result)


def generate_image_to_image(
    prompt,
    negative_prompt="",
    input_image=None,
    width=512,
    height=512
):
    image = Image.open(input_image).convert("RGB")
    image = image.resize((width, height))

    result = img2img_pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        image=image,
        strength=0.65,
        guidance_scale=7.5,
        num_inference_steps=25
    ).images[0]

    return save_image(result)