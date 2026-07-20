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
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

COPY requirements.txt /app/backend/
RUN pip install --no-cache-dir -r requirements.txt

# 代码通过 Volume 挂载，不需要 COPY
# 开发模式：Daphne + Django runserver 支持 --reload

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate && python manage.py init_admin && daphne -b 0.0.0.0 -p 8000 config.asgi:application"]
