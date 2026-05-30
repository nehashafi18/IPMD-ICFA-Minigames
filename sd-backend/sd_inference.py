import os
import uuid
from PIL import Image

from sd_model_loader import txt2img_pipe, img2img_pipe

OUTPUT_DIR = "outputs"


def save_image(image):
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    filename = f"{uuid.uuid4()}.png"
    path = os.path.join(OUTPUT_DIR, filename)

    image.save(path)

    return path


def generate_text_to_image(
    prompt,
    negative_prompt="",
    width=512,
    height=512
):
    image = txt2img_pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        width=width,
        height=height,
        num_inference_steps=30,
        guidance_scale=7.5
    ).images[0]

    return save_image(image)


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
        num_inference_steps=30
    ).images[0]

    return save_image(result)