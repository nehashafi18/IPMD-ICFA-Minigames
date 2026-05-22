# Image Cards to Fine Arts

AI-powered artistic image generation platform using:

- React frontend
- Node.js backend
- Qwen / Gemini prompt generation
- Stable Diffusion image generation
- Card-based artistic prompting system

---

# Project Overview

This project allows users to generate artistic AI images using a card-based prompt system.

Instead of manually writing long prompts, users select visual cards such as:

- style cards
- emotion cards
- texture cards
- special effect cards

The selected cards are transformed into a structured AI prompt using a Large Language Model (LLM), then passed into Stable Diffusion to generate the final image.

Users may also:
- upload a source image
- enter a text subject
- generate only from cards
- choose output image size

---

# Features

## Prompt Card System

Supports:
- Style cards
- Emotion cards
- Texture cards
- Special effect cards

Each card contains:
- image
- name
- description
- prompt hints
- negative prompt hints

---

## AI Prompt Generation

Supports:
- Gemini API
- Qwen API
- Local Gemini models
- Local Ollama Qwen models

The LLM combines:
- card hints
- subject
- uploaded image context

into:
- Stable Diffusion prompts
- negative prompts

---

## Stable Diffusion Image Generation

Supports:
- text-to-image
- image-to-image
- customizable image size
- Docker deployment

---

## Frontend Features

- visual card selection
- hover descriptions
- image upload
- generated image display
- loading mini-games
- responsive UI

---

# System Architecture

```txt
Frontend (React + Vite)
        ↓
Backend API (Node.js + Express)
        ↓
LLM Prompt Generation
(Gemini / Qwen / Ollama)
        ↓
Stable Diffusion Backend (FastAPI)
        ↓
Generated Image
```

---

# Project Structure

```txt
Image_Cards_to_Fine_Arts/
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── components/
│   │   │   ├── miniGames/
│   │   │   └── ui/
│   │   │
│   │   ├── assets/
│   │   └── main.tsx
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   ├── package.json
│   └── .env
│
├── sd-backend/
│   ├── app.py
│   ├── generate.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── outputs/
│
└── README.md
```

---

# Frontend

## Location

`frontend/`

## Main Responsibilities

- display cards
- collect user input
- upload images
- display generated prompts
- display generated images
- show mini-games during generation

---

# Backend

## Location

`backend/`

## Main Responsibilities

- load card JSON files
- validate requests
- build structured prompts
- call LLM APIs
- communicate with Stable Diffusion backend

---

# Stable Diffusion Backend

## Location

`sd-backend/`

## Responsibilities

- text-to-image generation
- image-to-image generation
- image saving
- image serving

---

# Running the App

## From project root

```bash
docker compose up --build
```

## Open

Frontend:

```txt
http://localhost:5173
```

Backend:

```txt
http://localhost:5001
```

SD backend:

```txt
http://localhost:8000
```

## Stop all

```bash
docker compose down
```