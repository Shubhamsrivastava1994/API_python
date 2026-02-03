# 🔹 Base image
FROM python:3.13-slim

# 🔹 Environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 🔹 Working directory
WORKDIR /app

# 🔹 System dependencies (bcrypt ke liye)
RUN apt-get update && apt-get install -y \
    gcc \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# 🔹 Copy requirements
COPY requirements.txt .

# 🔹 Install python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# 🔹 Copy project files
COPY . .

# 🔹 Expose Flask port
EXPOSE 5000

# 🔹 Run app
CMD ["python", "app_authentication.py"]
