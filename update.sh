#!/bin/bash
set -e

echo "========================================"
echo "  IQAir Workbench - 更新脚本"
echo "========================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[1/5] 拉取最新代码..."
git fetch origin
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git pull origin "$CURRENT_BRANCH"

if [ ! -f .env ]; then
    echo "[提示] 未找到 .env 文件，跳过 Docker 部署。"
    echo "[提示] 若要部署到生产环境，请先配置 .env 文件或运行 deploy.sh。"
    echo ""
    echo "========================================"
    echo "  代码更新完成！"
    echo "========================================"
    echo ""
    exit 0
fi

if ! command -v docker &> /dev/null; then
    echo "[提示] 未检测到 Docker，跳过容器部署。"
    echo ""
    echo "========================================"
    echo "  代码更新完成！"
    echo "========================================"
    echo ""
    exit 0
fi

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
