# Deployment Guide

This document explains how to deploy the Image Cards to Fine Arts system using Docker Compose.

---

# Services

The application consists of 3 services:

| Service | Port | Description |
|---|---|---|
| Frontend | 5173 | React + TypeScript UI |
| Backend API | 5001 | Express API server |
| SD Backend | 8000 | Stable Diffusion inference server |

---

# Requirements

Install:

- Docker
- Docker Compose

Recommended versions:

```bash
docker --version
docker compose version
```

---

# Project Structure

```txt
Image_Cards_to_Fine_Arts/
├── frontend/
├── backend/
├── sd-backend/
├── deploy/
└── README.md
```

---

# Environment Setup

Before running the project, create local `.env` files.

Backend:

```bash
cp backend/.env.example backend/.env
```

SD backend:

```bash
cp sd-backend/.env.example sd-backend/.env
```

Then fill in your API keys and tokens.

Required:
- HuggingFace token
- Gemini API key (if using Gemini)

---

# Build & Start

From the deploy folder:

```bash
cd deploy
docker compose up --build
```

---

# Run in Background

```bash
docker compose up -d --build
```

---

# Stop Containers

```bash
docker compose down
```

---

# Rebuild Specific Service

Backend:

```bash
docker compose build backend
```

Frontend:

```bash
docker compose build frontend
```

SD backend:

```bash
docker compose build sd-backend
```

---

# View Logs

All services:

```bash
docker compose logs -f
```

Backend only:

```bash
docker compose logs -f backend
```

---

# Running Health Checks

From the deploy folder:

```bash
cd deploy
```

Make the script executable (first time only):

```bash
chmod +x healthcheck.sh
```

Run the health check:

```bash
./healthcheck.sh
```

Expected output:

```txt
Checking frontend...
Checking backend...
Checking Stable Diffusion backend...
All services are healthy
```

---

# Local URLs

Frontend:

```txt
http://localhost:5173
```

Backend:

```txt
http://localhost:5001
```

Stable Diffusion backend:

```txt
http://localhost:8000
```

---

# Common Issues

## Port Already In Use

Error:

```txt
Bind for 0.0.0.0 failed: port is already allocated
```

Solution:

```bash
lsof -i :5001
kill -9 <PID>
```

---

## Docker Cache Problems

Rebuild without cache:

```bash
docker compose build --no-cache
```

---

## HuggingFace Model Download Issues

Ensure internet access is available during first startup.

Models are cached in:

```txt
~/hf_cache
```
---

# Automatic Restart

Containers automatically restart unless stopped manually.

Add to services:

```yml
restart: unless-stopped
```