FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV DEBIAN_FRONTEND=noninteractive

# 安装 MySQL 和 Pillow 依赖
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    pkg-config \
    gcc \
    libjpeg-dev \
    zlib1g-dev \
    libpq-dev \
    curl \
    docker.io \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

COPY requirements.txt /app/backend/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/backend/

RUN mkdir -p /app/backend/logs

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate && python manage.py init_admin && python manage.py collectstatic --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4 --timeout 120"]
