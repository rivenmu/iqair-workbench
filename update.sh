#!/bin/bash
set -e

echo "========================================"
echo "  IQAir Workbench - 生产环境更新脚本"
echo "========================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f .env ]; then
    echo "[错误] 未找到 .env 文件！请先运行 deploy.sh 进行首次部署。"
    exit 1
fi

echo "[1/5] 拉取最新代码..."
git fetch origin
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git pull origin "$CURRENT_BRANCH"

echo "[2/5] 重新构建并重启服务..."
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

echo "[3/5] 清理旧的 Docker 镜像..."
docker image prune -f

echo "[4/5] 等待服务启动..."
sleep 10

echo "[5/5] 检查服务状态..."
docker compose -f docker-compose.prod.yml ps

echo ""
echo "========================================"
echo "  更新完成！"
echo "========================================"
echo ""
echo "查看日志: docker compose -f docker-compose.prod.yml logs -f"
echo ""
