#!/bin/bash

set -e

echo "========================================="
echo " Image Cards to Fine Arts - Local Setup"
echo "========================================="

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "Installing frontend dependencies..."
cd "$ROOT_DIR/frontend"
npm install

echo ""
echo "Installing backend dependencies..."
cd "$ROOT_DIR/backend"
npm install

echo ""
echo "Installing SD backend dependencies..."
cd "$ROOT_DIR/sd-backend"

python3 -m venv venv || true
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

deactivate

echo ""
echo "Installing Qwen backend dependencies..."
cd "$ROOT_DIR/qwen-backend"

python3 -m venv venv || true
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

deactivate

echo ""
echo "Creating required directories..."

mkdir -p "$ROOT_DIR/sd-backend/outputs"
mkdir -p "$HOME/hf_cache"

echo ""
echo "Checking environment files..."

if [ ! -f "$ROOT_DIR/backend/.env" ]; then
cp "$ROOT_DIR/backend/.env.example" "$ROOT_DIR/backend/.env"
fi

if [ ! -f "$ROOT_DIR/sd-backend/.env" ]; then
cp "$ROOT_DIR/sd-backend/.env.example" "$ROOT_DIR/sd-backend/.env"
fi

echo ""
echo "========================================="
echo " Local installation complete"
echo "========================================="
echo ""
echo "Start services manually:"
echo ""
echo "Backend:"
echo "  cd backend && npm run dev"
echo ""
echo "Frontend:"
echo "  cd frontend && npm run dev"
echo ""
echo "Qwen:"
echo "  cd qwen-backend && source venv/bin/activate && uvicorn app:app --reload --port 8001"
echo ""
echo "Stable Diffusion:"
echo "  cd sd-backend && source venv/bin/activate && uvicorn app:app --reload --port 8000"
echo ""
echo "AI models will be downloaded on first use."
