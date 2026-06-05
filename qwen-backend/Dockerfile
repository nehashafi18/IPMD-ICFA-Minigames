FROM image-cards-python-ai-base:latest

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "local_qwen_server:app", "--host", "0.0.0.0", "--port", "8001"]
