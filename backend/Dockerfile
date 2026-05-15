# Backend Dockerfile (used by Render when the service is in Docker mode).
# Render also supports building this project as a native Python service via
# render.yaml — both paths produce an identical runtime.

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install Python dependencies first (Docker layer cache).
COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

# Application code.
COPY . .

# Render injects the public port via $PORT (default 10000 if unset).
ENV PORT=10000
EXPOSE 10000

# `python server.py` runs the uvicorn entrypoint defined at the bottom of server.py.
CMD ["python", "server.py"]
