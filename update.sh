#!/bin/bash
set -e

echo "========================================"
echo "  IQAir Workbench - 更新脚本"
echo "========================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BACKUP_DIR="$SCRIPT_DIR/backups"
mkdir -p "$BACKUP_DIR"

if [ ! -f .env ]; then
    echo "[提示] 未找到 .env 文件，跳过 Docker 部署。"
    echo "[1/2] 拉取最新代码..."
    git fetch origin
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    git pull origin "$CURRENT_BRANCH"
    echo ""
    echo "========================================"
    echo "  代码更新完成！"
    echo "========================================"
    echo ""
    exit 0
fi

if ! command -v docker &> /dev/null; then
    echo "[提示] 未检测到 Docker，跳过容器部署。"
    echo "[1/2] 拉取最新代码..."
    git fetch origin
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    git pull origin "$CURRENT_BRANCH"
    echo ""
    echo "========================================"
    echo "  代码更新完成！"
    echo "========================================"
    echo ""
    exit 0
fi

echo "[1/6] 备份数据库..."
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
if docker compose -f docker-compose.prod.yml ps mysql | grep -q "Up"; then
    docker compose -f docker-compose.prod.yml exec mysql mysqldump -u iqair -pIqAir@2026Riven! iqair_workbench > "$BACKUP_FILE" 2>/dev/null
    if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
        echo "      ✓ 数据库备份成功: $BACKUP_FILE"
    else
        echo "      ✗ 数据库备份失败！"
        echo "      继续更新可能会导致数据丢失，是否继续？(y/N)"
        read -r confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            echo "      已取消更新。"
            exit 0
        fi
    fi
else
    echo "      ✓ MySQL 容器未运行，跳过备份"
fi

echo "[2/6] 拉取最新代码..."
git fetch origin
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git pull origin "$CURRENT_BRANCH"

echo "[3/6] 重新构建并重启服务..."
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

echo "[4/6] 清理旧的 Docker 镜像..."
docker image prune -f

echo "[5/6] 等待服务启动..."
sleep 10

echo "[6/6] 检查服务状态..."
docker compose -f docker-compose.prod.yml ps

echo ""
echo "========================================"
echo "  更新完成！"
echo "========================================"
echo ""
echo "查看日志: docker compose -f docker-compose.prod.yml logs -f"
echo "备份目录: $BACKUP_DIR"
echo ""
