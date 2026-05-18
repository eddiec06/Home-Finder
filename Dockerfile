# Root Dockerfile (used by Render when the service is in Docker mode and
# expects the Dockerfile at the repository root).
# Builds and runs the HomeFinder FastAPI backend.
#
# The React frontend is deployed separately as a Static Site (see render.yaml)
# and does NOT need a Dockerfile.

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install Python dependencies first so the layer is cached.
COPY backend/requirements.txt ./requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

# Application code (only the backend is needed in this image).
COPY backend/ ./

# Render injects the public port via $PORT (default 10000 if unset).
ENV PORT=10000
EXPOSE 10000

# server.py contains an `if __name__ == "__main__"` block that starts uvicorn
# on $PORT, so this single command works in production.
CMD ["python", "server.py"]
