from fastapi import FastAPI
from pydantic import BaseModel

import os
import torch

from huggingface_hub import login
from transformers import AutoTokenizer, AutoModelForCausalLM

HF_TOKEN = os.getenv("HF_TOKEN")

MODEL_ID = os.getenv(
    "QWEN_MODEL",
    "Qwen/Qwen2.5-1.5B-Instruct"
)

if HF_TOKEN:
    login(token=HF_TOKEN)

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

DTYPE = (
    torch.float16
    if torch.cuda.is_available()
    else torch.float32
)

print("=" * 60)
print("Starting Qwen Local Server")
print(f"Model: {MODEL_ID}")
print(f"Device: {DEVICE}")
print("=" * 60)

print(f"Loading tokenizer...")

tokenizer = AutoTokenizer.from_pretrained(
    MODEL_ID,
    token=HF_TOKEN
)

print(f"Loading model...")

model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    torch_dtype=DTYPE,
    device_map="auto",
    token=HF_TOKEN
)

model.eval()

print("Qwen model ready!")

app = FastAPI()


class PromptRequest(BaseModel):
    instruction: str


@app.get("/health")
def health():
    return {
        "success": True,
        "service": "qwen-local",
        "status": "healthy",
        "model": MODEL_ID,
        "device": DEVICE
    }


@app.post("/generate")
async def generate(req: PromptRequest):

    messages = [
        {
            "role": "user",
            "content": req.instruction
        }
    ]

    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )

    inputs = tokenizer(
        text,
        return_tensors="pt"
    ).to(model.device)

    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=180,
            temperature=0.7,
            top_p=0.9,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )

    result = tokenizer.decode(
        output[0][inputs["input_ids"].shape[1]:],
        skip_special_tokens=True
    ).strip()

    return {
        "response": result
    }