#!/bin/bash
set -e

echo "========================================"
echo "  IQAir Workbench - 生产环境部署脚本"
echo "========================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f .env ]; then
    echo "[错误] 未找到 .env 文件！"
    echo "请先复制 .env.prod.example 为 .env 并配置正确的环境变量："
    echo "  cp .env.prod.example .env"
    echo "  vim .env"
    exit 1
fi

echo "[1/6] 创建必要的数据目录..."
mkdir -p data/mysql data/redis data/snapshots data/logs/mysql data/logs/backend uploadfiles

echo "[2/6] 设置 MySQL 数据目录权限..."
if [ -d "data/mysql" ]; then
    chown -R 999:999 data/mysql 2>/dev/null || true
fi

echo "[3/6] 拉取最新代码..."
git pull origin main || git pull origin master || true

echo "[4/6] 构建并启动 Docker 容器..."
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

echo "[5/6] 等待服务启动..."
sleep 10

echo "[6/6] 检查服务状态..."
docker compose -f docker-compose.prod.yml ps

echo ""
echo "========================================"
echo "  部署完成！"
echo "========================================"
echo ""
echo "常用命令："
echo "  查看日志:    docker compose -f docker-compose.prod.yml logs -f"
echo "  停止服务:    docker compose -f docker-compose.prod.yml down"
echo "  重启服务:    docker compose -f docker-compose.prod.yml restart"
echo "  更新代码:    ./update.sh"
echo ""
