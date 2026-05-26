# Image Cards to Fine Arts

AI-powered artistic image generation platform using:

- React + TypeScript frontend
- Modular Node.js backend API
- Qwen / Gemini prompt generation
- Stable Diffusion 1.5 image generation
- Card-based artistic prompting system
- Dockerized deployment pipeline

---

# Project Overview

Image Cards to Fine Arts is an AI-assisted creative platform that transforms structured artistic card selections into high-quality generated artwork.

Instead of manually writing complex prompts, users select visual artistic cards such as:

- emotion cards
- memory cards
- imagination cards
- style cards

The selected cards are transformed into structured prompts using a Large Language Model (LLM), then passed into Stable Diffusion to generate final AI artwork.

Users may also:
- upload a source image
- enter a text subject
- generate only from cards
- customize image dimensions
- use local or cloud AI models

---

# Core Features

## Card-Based Prompt System

Supports:
- Style cards
- Emotion cards
- Memory cards
- Imagination cards

Each card contains:
- preview image
- display name
- description
- prompt hints
- negative prompt hints
- weighted prompt fragments

---

## AI Prompt Generation

Supports:
- Gemini API
- Qwen API
- Ollama local models
- Local Gemma models

The LLM combines:
- selected card metadata
- prompt weights
- subject text
- uploaded image context

into:
- Stable Diffusion prompts
- negative prompts
- SD-compatible optimized prompt text

---

## Stable Diffusion Image Generation

Supports:
- text-to-image
- image-to-image
- configurable image size
- Docker deployment
- CPU inference pipeline
- future OpenVINO optimization support

---

## Frontend Features

- visual card selection interface
- hover descriptions
- image uploads
- generated image display
- loading mini-games
- responsive UI
- TypeScript architecture
- Framer Motion animations

---

# System Architecture

```txt
Frontend (React + TypeScript + Vite)
        ↓
Backend API Server (Node.js + Express)
        ↓
Card Parsing Pipeline
        ↓
LLM Prompt Generation
(Gemini / Qwen / Ollama)
        ↓
Stable Diffusion Pipeline
(FastAPI / Diffusers)
        ↓
Generated Image
```

---

# Project Structure

```txt
Image_Cards_to_Fine_Arts/
│
├── frontend/
│   ├── public/
│   │   ├── cards/
│   │   └── icons/
│   │
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── App.css
│   │   └── components/
│   │       └── miniGames/
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── vite.config.ts
│
├── backend/
│   │
│   ├── server.js
│   │
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── prompts/
│   │   ├── style_cards.json
│   │   ├── emotion_cards.json
│   │   ├── memory_cards.json
│   │   └── imagination_cards.json
│   │
│   ├── llm/
│   ├── uploads/
│   ├── package.json
│   ├── Dockerfile
│   └── .env
│
├── sd-backend/
│   ├── app.py
│   ├── generate.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── outputs/
│
├── deploy/
│   ├── docker-compose.yml
│   ├── healthcheck.sh
│   └── README_DEPLOY.md
│
└── README.md
```

---

# Frontend

## Location

`frontend/`

## Responsibilities

- display artistic cards
- collect user selections
- upload source images
- display generated prompts
- display generated artwork
- run loading mini-games
- manage frontend state
- communicate with backend APIs

---

# Backend API Server

## Location

`backend/`

## Responsibilities

- API routing
- request validation
- card metadata parsing
- structured prompt building
- LLM communication
- Stable Diffusion communication
- error handling
- logging
- authentication/session handling

---

# API Endpoints

## Parse Selected Cards

```txt
POST /api/cards/parse
```

Input:
- selected card IDs

Output:
- structured artistic metadata JSON

---

## Build AI Prompt

```txt
POST /api/prompt/build
```

Input:
- structured card metadata
- subject text
- image context

Output:
- final Stable Diffusion prompt
- negative prompt

---

## Generate AI Art

```txt
POST /api/art/generate
```

Input:
- Stable Diffusion prompt

Output:
- generated image
- image path
- generation metadata

---

# Stable Diffusion Backend

## Location

`sd-backend/`

## Responsibilities

- text-to-image inference
- image-to-image inference
- CPU image generation
- image saving
- image serving
- model loading
- optimization pipeline

---

# AI Pipeline Flow

```txt
Card Selection
      ↓
Card Metadata Parsing
      ↓
LLM Prompt Optimization
      ↓
Stable Diffusion Prompt Generation
      ↓
Image Generation
      ↓
Final Artwork Output
```

---

# Running the Application

## Build & Start

From project root:

```bash
docker compose up --build
```

---

# Local URLs

## Frontend

```txt
http://localhost:5173
```

## Backend API

```txt
http://localhost:5001
```

## Stable Diffusion Backend

```txt
http://localhost:8000
```

---

# Stop Containers

```bash
docker compose down
```

---

# Environment Variables

Example backend `.env`:

```env
PORT=5001

LLM_PROVIDER=qwen

QWEN_BASE_URL=http://localhost:11434/v1
QWEN_MODEL=qwen3.5:2b

SD_TXT2IMG_URL=http://sd-backend:8000/generate-text-to-image
SD_IMG2IMG_URL=http://sd-backend:8000/generate-image-to-image
```

---

# Future Improvements

Planned future features include:

- OpenVINO acceleration
- ONNX inference optimization
- image history system
- user authentication
- cloud deployment
- art sharing/community system
- prompt fine-tuning
- advanced image editing
- multi-image generation
- distributed AI inference

---

# Technologies Used

Frontend:
- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion

Backend:
- Node.js
- Express
- Multer
- python

AI / ML:
- Gemini
- Qwen
- Stable Diffusion 1.5
- Diffusers
- PyTorch

Deployment:
- Docker
- Docker Compose