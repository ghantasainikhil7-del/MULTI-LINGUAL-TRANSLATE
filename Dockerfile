FROM python:3.10-slim

# Install system dependencies (including tesseract-ocr for OCR support)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set up a new user named "user" with UID 1000 for security
RUN useradd -m -u 1000 user

# Set environment variables for path and home
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Set working directory
WORKDIR /app

# Copy requirements file first to take advantage of Docker layering cache
COPY --chown=user:user requirements.txt /app/requirements.txt

# Switch to non-root user
USER user

# Install Python requirements
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

# Pre-download the Hugging Face model and tokenizer so they are cached in the docker image
RUN python -c "from transformers import AutoTokenizer, AutoModelForSeq2SeqLM; model_name = 'facebook/nllb-200-distilled-600M'; AutoTokenizer.from_pretrained(model_name); AutoModelForSeq2SeqLM.from_pretrained(model_name)"

# Copy application files
COPY --chown=user:user . /app

# Expose port 7860 (Hugging Face Spaces default port)
EXPOSE 7860

# Run Flask using Gunicorn on port 7860
CMD ["gunicorn", "-b", "0.0.0.0:7860", "--timeout", "120", "app:app"]
