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

## Build & Start With Docker Compose

From project root:

```powershell
docker compose -f deploy\docker-compose.yml up --build
```

---

# Local URLs

```txt
Frontend:              http://localhost:5173
Backend API:           http://localhost:5001
Backend-hosted admin:  http://localhost:5001/vms-admin
Stable Diffusion API:  http://localhost:8000
```

---

# Stop Containers

```powershell
docker compose -f deploy\docker-compose.yml down
```

---

# Visitor Management System

This project includes a Visitor Management System (VMS) for gated MVP access.

The main Image Cards experience is protected by one-time entry tokens:

```txt
/                       Public access-required page
/enter?token=<uuid>     Token redemption page
/image-cards            Protected Image Cards app
/vms-admin              VMS admin console served by backend after Docker/backend build
```

The VMS admin console is used to:

- Generate internal demo/MVP entry tokens.
- View donation/token records.
- View visitor entry logs.
- Revoke or restore token access.
- Edit token/session settings.

The admin console does not manage artwork upload/download in this project.

Detailed VMS documentation is in:

```txt
docs/VMS.md
```

## Token Flow

1. Open the VMS admin console.
2. Generate an entry token for a visitor.
3. Share the generated entry URL:

```txt
http://localhost:5173/enter?token=<uuid>
```

4. The backend validates and redeems the token.
5. The backend sets a signed HttpOnly cookie named `gallery_session`.
6. The visitor is redirected to `/image-cards`.

Tokens are one-time redeemable. After first redemption, the token is marked as used and cannot be redeemed again. The browser session remains valid until the `gallery_session` cookie expires.

## Admin Key

The VMS admin "password" is currently a shared API key, not a full user account system.

Default local key:

```txt
dev-admin-key
```

Change it with:

```env
VMS_ADMIN_API_KEY=replace-with-a-private-admin-key
```

For npm development, put it in `backend/.env`.

For Docker Compose:

```powershell
$env:VMS_ADMIN_API_KEY="replace-with-a-private-admin-key"
docker compose -f deploy\docker-compose.yml up --build
```

Do not use the default key in production or commit real keys to GitHub.

## Enable Or Disable Gated Access

Gated access is enabled by default.

To disable the gate for local development only:

```env
DISABLE_GALLERY_GATE=true
```

Then restart the backend. You can directly open:

```txt
http://localhost:5173/image-cards
```

To enable the gate again:

```env
DISABLE_GALLERY_GATE=false
```

or remove the variable.

Never enable `DISABLE_GALLERY_GATE=true` in production or public demo deployments.

## VMS Data Storage

The VMS uses SQLite.

Local npm path:

```txt
backend/data/vms.sqlite
```

Docker Compose volume:

```txt
vms_data:/app/data
```

This stores generated tokens, donation records, visitor logs, and VMS settings.

---

# Environment Variables

Example backend `.env`:

```env
PORT=5001
FRONTEND_ORIGIN=http://localhost:5173
PUBLIC_APP_URL=http://localhost:5173

DATABASE_URL=./data/vms.sqlite
VMS_ADMIN_API_KEY=dev-admin-key
ALLOW_SIMULATED_PAYMENTS=true
DISABLE_GALLERY_GATE=false
ACCESS_TOKEN_TTL_HOURS=720
GALLERY_SESSION_TTL_HOURS=12
GALLERY_SESSION_SECRET=replace-with-a-long-random-secret
DEFAULT_GALLERY_ID=image-cards

LLM_PROVIDER=qwen

QWEN_BASE_URL=http://localhost:11434/v1
QWEN_MODEL=qwen3.5:2b

SD_TXT2IMG_URL=http://sd-backend:8000/generate-text-to-image
SD_IMG2IMG_URL=http://sd-backend:8000/generate-image-to-image
```

Important:

- `GALLERY_SESSION_SECRET` must be long, random, and private.
- Changing `GALLERY_SESSION_SECRET` invalidates existing visitor sessions.
- `VMS_ADMIN_API_KEY` must not be the default value in production.
- `DISABLE_GALLERY_GATE` must be false or unset in production.
- `PUBLIC_APP_URL` must match the frontend URL used in generated entry links.
- `FRONTEND_ORIGIN` must match the frontend origin allowed to send cookies.

---

# Local Development Without Docker

Backend:

```powershell
cd backend
npm install
npm run dev
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

VMS admin:

```powershell
cd vms-admin
npm install
npm run dev
```

Open:

```txt
Frontend:  http://localhost:5173
Admin:     http://localhost:5174
Backend:   http://localhost:5001
```

The VMS gate can be developed without Ollama or Stable Diffusion models. Token generation, token redemption, and protected route access still work. Final prompt/image generation may fail until LLM and Stable Diffusion services are available.

---

# Future Improvements

Planned future features include:

- Stripe payment integration for automatic token issuing
- stronger admin authentication beyond shared API key
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
