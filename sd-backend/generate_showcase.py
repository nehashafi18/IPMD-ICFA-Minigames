#!/usr/bin/env python3
"""
Batch-generates unique fine-art showcase images for the TransitionScreen
gallery flythrough (frontend/src/assets/new-showcase/).

Each image is a unique (style, subject, palette) combination — no prompt is
repeated, so no two generated images are alike. Requires the local SD
backend running: cd sd-backend && uvicorn app:app --port 8000

Usage:
    python generate_showcase.py [count]     # default: 150
"""

import itertools
import os
import random
import shutil
import sys
import time

import requests

SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
OUT_DIR      = os.path.join(SCRIPT_DIR, "outputs")
SHOWCASE_DIR = os.path.join(SCRIPT_DIR, "../frontend/src/assets/new-showcase")
SD_URL       = "http://localhost:8000/generate-text-to-image"

os.makedirs(SHOWCASE_DIR, exist_ok=True)

NEGATIVE = (
    "blurry, low quality, watermark, text, signature, low resolution, "
    "noisy, distorted, deformed, ugly, cropped, out of frame, photorealistic, photo"
)

STYLES = [
    "impressionist oil painting", "abstract expressionist painting",
    "loose watercolor painting", "pointillist painting", "fauvist painting",
    "art nouveau illustration", "japanese ukiyo-e woodblock print",
    "cubist painting", "surrealist painting", "romanticist oil painting",
    "minimalist geometric abstract art", "ink wash painting",
    "gouache painting", "pastel chalk drawing", "baroque still life painting",
    "contemporary mixed-media collage", "acrylic palette-knife painting",
    "digital matte painting", "stained-glass mosaic art",
    "charcoal and ink sketch",
]

SUBJECTS = [
    "misty mountain range at dawn", "golden wheat field under a wide sky",
    "quiet koi pond with lily pads", "lighthouse on a rocky coastline",
    "blooming cherry blossom branch", "vase of wildflowers on a table",
    "bowl of citrus fruit still life", "autumn forest path",
    "snow-covered village at dusk", "desert dunes under starlight",
    "tropical rainforest canopy", "lavender field at sunset",
    "waterfall in a green canyon", "aurora borealis over a frozen lake",
    "rolling vineyard hills", "old stone bridge over a river",
    "city skyline at night", "sailboats in a harbor at sunrise",
    "cluster of paper lanterns", "spiral galaxy and nebula",
    "geometric mandala pattern", "abstract swirl of color and light",
    "windswept coastal cliffs", "orchard in full bloom",
    "reflection of trees in a still lake", "hot air balloons over hills",
    "candlelit still life with books", "coral reef teeming with color",
    "sunflower field in summer", "birch forest in winter fog",
]

PALETTES = [
    "warm amber and rust tones", "cool blues and teals",
    "soft pastel pinks and lavender", "deep jewel tones",
    "muted earthy neutrals", "vibrant sunset oranges and purples",
    "monochrome sepia", "emerald and gold",
    "dusty rose and sage green", "midnight indigo and silver",
]


def slugify(text: str) -> str:
    return "-".join(text.lower().replace(",", "").split())


def build_prompt_pool(count: int, seed: int = 7):
    """All (style, subject, palette) combos, shuffled deterministically, deduped."""
    combos = list(itertools.product(STYLES, SUBJECTS, PALETTES))
    rng = random.Random(seed)
    rng.shuffle(combos)
    if count > len(combos):
        raise ValueError(f"Requested {count} unique combos but only {len(combos)} exist.")
    return combos[:count]


def call_sd(prompt: str, negative: str, seed: int) -> str:
    payload = {
        "prompt": prompt,
        "negative_prompt": negative,
        "width": 512,
        "height": 512,
        "steps": 25,
        "cfg_scale": 7.0,
        "sampler": "DPM++ 2M Karras",
        "upscale_factor": 2,
        "seed": seed,
    }
    last_err = None
    for attempt in range(1, 4):
        try:
            r = requests.post(SD_URL, json=payload, timeout=300)
            r.raise_for_status()
            return os.path.join(OUT_DIR, r.json()["filename"])
        except requests.exceptions.ConnectionError:
            raise RuntimeError(
                f"SD backend not reachable at {SD_URL}\n"
                "  Start it: cd sd-backend && uvicorn app:app --reload --port 8000"
            )
        except Exception as e:
            last_err = e
            print(f"  ! attempt {attempt}/3 failed: {e} — retrying in 10s")
            time.sleep(10)
    raise RuntimeError(f"SD backend failed after 3 attempts: {last_err}")


def main():
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 150
    combos = build_prompt_pool(count)

    print(f"Generating {count} unique showcase images -> {SHOWCASE_DIR}")
    t_start = time.time()
    done = 0

    for i, (style, subject, palette) in enumerate(combos, start=1):
        prompt = f"{style} of {subject}, {palette}, fine art, gallery quality, detailed"
        seed = 1000 + i
        filename = f"{slugify(style)}_{slugify(subject)}_{i:03d}.jpg"
        dst = os.path.join(SHOWCASE_DIR, filename)

        if os.path.exists(dst):
            print(f"[{i}/{count}] skip (exists) {filename}")
            continue

        t0 = time.time()
        try:
            src = call_sd(prompt, NEGATIVE, seed)
        except RuntimeError as e:
            print(f"[{i}/{count}] ABORT: {e}")
            sys.exit(1)

        shutil.copy2(src, dst)
        done += 1
        elapsed = time.time() - t0
        total_elapsed = time.time() - t_start
        remaining = (count - i) * (total_elapsed / i)
        print(
            f"[{i}/{count}] {filename}  ({elapsed:.1f}s)  "
            f"elapsed={total_elapsed/60:.1f}m  eta={remaining/60:.1f}m"
        )

    print(f"\nDone. {done} new images written to {SHOWCASE_DIR} "
          f"in {(time.time()-t_start)/60:.1f} minutes.")


if __name__ == "__main__":
    main()
