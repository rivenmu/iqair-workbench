#!/bin/sh
# =============================================================================
# IQAir Workbench — 数据库 + 文件同步脚本
#
# 由 db-sync-cron 容器 cron 每小时调用，或通过 Django Admin 手动触发。
# 从服务器拉取最新数据库 dump 和 media/snapshots 文件。
#
# 同步方向：服务器 -> 本地（单向覆盖）
# 服务器端零改动（不增加服务、不修改配置）
# =============================================================================

set -e

LOG_FILE="/sync/logs/sync.log"
SYNC_DIR="/sync"

# 确保日志目录存在
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "========== 开始同步 =========="

# ---- 读取环境变量 ----
SERVER_HOST="${SERVER_HOST:-10.0.0.6}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_DB_PASS="${SERVER_DB_PASS:?SERVER_DB_PASS is required}"
SSH_PASSWORD="${SSH_PASSWORD:-}"
SERVER_COMPOSE_FILE="${SERVER_COMPOSE_FILE:-/opt/iqair-workbench/docker-compose.yml}"
# 从 compose 文件路径推导服务器项目根目录
SERVER_PROJECT_DIR="$(dirname "${SERVER_COMPOSE_FILE}")"

LOCAL_DB_HOST="${LOCAL_DB_HOST:-iqair-mysql}"
LOCAL_DB_PORT="${LOCAL_DB_PORT:-3306}"
LOCAL_DB_USER="${LOCAL_DB_USER:-iqair}"
LOCAL_DB_PASS="${LOCAL_DB_PASS:-iqairpassword123}"
LOCAL_DB_NAME="${LOCAL_DB_NAME:-iqair_workbench}"
LOCAL_ROOT_PASS="${LOCAL_ROOT_PASS:-rootpassword123}"

# ---- SSH 认证 ----
SSH_CMD="ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10"
SCP_CMD="scp -o StrictHostKeyChecking=no -o ConnectTimeout=10"

if [ -n "$SSH_PASSWORD" ]; then
    # 使用 sshpass (如果已安装)
    if command -v sshpass >/dev/null 2>&1; then
        SSH_CMD="sshpass -e ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10"
        export SSHPASS="$SSH_PASSWORD"
        log "使用 sshpass (密码认证)"
    else
        log "警告: SSH_PASSWORD 已设置但 sshpass 未安装，尝试密钥认证"
    fi
fi

# ---- 测试 SSH 连接 ----
log "测试 SSH 连接到 ${SERVER_USER}@${SERVER_HOST}..."
if ! ${SSH_CMD} "${SERVER_USER}@${SERVER_HOST}" "echo SSH_OK" >/dev/null 2>&1; then
    log "错误: 无法 SSH 连接到服务器 ${SERVER_HOST}"
    exit 1
fi
log "SSH 连接成功"

# ---- 步骤 1: 数据库同步 ----
log "开始数据库同步..."

# 1a. 通过 SSH 在服务器上执行 mysqldump，管道直接导入本地 MySQL
START_TIME=$(date +%s)

if ${SSH_CMD} "${SERVER_USER}@${SERVER_HOST}" \
    "docker compose -f ${SERVER_COMPOSE_FILE} exec -T mysql \
     mysqldump -u iqair -p\"${SERVER_DB_PASS}\" --single-transaction --routines --triggers --no-tablespaces iqair_workbench" \
    | mysql -h "${LOCAL_DB_HOST}" -P "${LOCAL_DB_PORT}" -u root -p"${LOCAL_ROOT_PASS}" "${LOCAL_DB_NAME}" 2>/tmp/mysql_import_err.log; then
    
    ELAPSED=$(($(date +%s) - START_TIME))
    log "数据库同步成功 (耗时 ${ELAPSED}s)"
else
    log "错误: 数据库同步失败"
    cat /tmp/mysql_import_err.log 2>/dev/null | tee -a "$LOG_FILE"
    exit 1
fi

# ---- 步骤 2: 文件同步 (media + snapshots) ----
log "开始文件同步..."

# 2a. media 目录
log "同步 media 目录..."
if ${SSH_CMD} "${SERVER_USER}@${SERVER_HOST}" \
    "test -d ${SERVER_PROJECT_DIR}/data/media" 2>/dev/null; then
    rsync -avz --delete --timeout=60 \
        -e "${SSH_CMD}" \
        "${SERVER_USER}@${SERVER_HOST}:${SERVER_PROJECT_DIR}/data/media/" \
        "${SYNC_DIR}/data/media/" 2>/tmp/rsync_media_err.log
    log "media 同步完成"
else
    log "服务器 media 目录不存在，跳过"
fi

# 2b. snapshots 目录
log "同步 snapshots 目录..."
if ${SSH_CMD} "${SERVER_USER}@${SERVER_HOST}" \
    "test -d ${SERVER_PROJECT_DIR}/data/snapshots" 2>/dev/null; then
    rsync -avz --delete --timeout=60 \
        -e "${SSH_CMD}" \
        "${SERVER_USER}@${SERVER_HOST}:${SERVER_PROJECT_DIR}/data/snapshots/" \
        "${SYNC_DIR}/data/snapshots/" 2>/tmp/rsync_snapshots_err.log
    log "snapshots 同步完成"
else
    log "服务器 snapshots 目录不存在，跳过"
fi

log "========== 同步完成 =========="
