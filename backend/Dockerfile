FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for compilation
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Render will override with $PORT)
EXPOSE 8000

# Use environment variable for port
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
