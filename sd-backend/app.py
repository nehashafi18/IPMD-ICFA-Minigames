from fastapi import FastAPI, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os

from generate import generate_image_to_image, generate_text_to_image

app = FastAPI()

os.makedirs("outputs", exist_ok=True)

app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")


class TextToImageRequest(BaseModel):
    prompt: str
    negative_prompt: str = ""
    width: int = 512
    height: int = 512


@app.get("/")
def root():
    return {
        "message": "Stable Diffusion backend running",
        "endpoints": [
            "/generate-text-to-image",
            "/generate-image-to-image"
        ]
    }


@app.post("/generate-text-to-image")
def text_to_image(req: TextToImageRequest):
    image_path = generate_text_to_image(
        prompt=req.prompt,
        negative_prompt=req.negative_prompt,
        width=req.width,
        height=req.height
    )

    return {
        "success": True,
        "image_url": f"http://localhost:8000/{image_path}"
    }


@app.post("/generate-image-to-image")
async def image_to_image(
    prompt: str = Form(...),
    negative_prompt: str = Form(""),
    width: int = Form(512),
    height: int = Form(512),
    image: UploadFile = File(...)
):
    image_path = generate_image_to_image(
        prompt=prompt,
        negative_prompt=negative_prompt,
        input_image=image.file,
        width=width,
        height=height
    )

    return {
        "success": True,
        "image_url": f"http://localhost:8000/{image_path}"
    }