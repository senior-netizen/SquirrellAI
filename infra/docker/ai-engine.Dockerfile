FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml README.md ./
COPY apps/ai-engine ./apps/ai-engine
RUN pip install --no-cache-dir .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--app-dir", "apps/ai-engine/src", "--host", "0.0.0.0", "--port", "8000"]
