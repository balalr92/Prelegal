# Stage 1: Build Next.js frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci
COPY frontend/ ./frontend/
COPY templates/ ./templates/
RUN cd frontend && npm run build

# Stage 2: Runtime (FastAPI + static files)
FROM python:3.12-slim
WORKDIR /app/backend

RUN pip install uv --no-cache-dir

COPY backend/pyproject.toml backend/uv.lock* ./
RUN uv sync --frozen --no-dev

COPY backend/ ./

COPY --from=frontend-builder /app/frontend/out /app/static

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
