#!/bin/sh
# =============================================================================
# IQAir Workbench — 数据库推送脚本
#
# 将本地 MySQL 数据库完整推送到服务器（方向：本地 -> 服务器）
# 用于本地开发完成后，将包含新字段和新数据的数据库一键部署到服务器。
#
# ⚠️ 警告：此操作会覆盖服务器上的所有数据，请确认后再执行。
# =============================================================================

set -e

LOG_FILE="/sync/logs/push.log"
SYNC_DIR="/sync"

mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "========== 开始推送数据库到服务器 =========="

# ---- 读取环境变量 ----
SERVER_HOST="${SERVER_HOST:-10.0.0.6}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_DB_PASS="${SERVER_DB_PASS:?SERVER_DB_PASS is required}"
SSH_PASSWORD="${SSH_PASSWORD:-}"
SERVER_COMPOSE_FILE="${SERVER_COMPOSE_FILE:-/opt/iqair-workbench/docker-compose.yml}"

LOCAL_DB_HOST="${LOCAL_DB_HOST:-iqair-mysql}"
LOCAL_DB_PORT="${LOCAL_DB_PORT:-3306}"
LOCAL_DB_USER="${LOCAL_DB_USER:-iqair}"
LOCAL_DB_PASS="${LOCAL_DB_PASS:-iqairpassword123}"
LOCAL_DB_NAME="${LOCAL_DB_NAME:-iqair_workbench}"
LOCAL_ROOT_PASS="${LOCAL_ROOT_PASS:-rootpassword123}"

# ---- SSH 认证 ----
SSH_CMD="ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10"

if [ -n "$SSH_PASSWORD" ]; then
    if command -v sshpass >/dev/null 2>&1; then
        SSH_CMD="sshpass -e ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10"
        export SSHPASS="$SSH_PASSWORD"
        log "使用 sshpass (密码认证)"
    fi
fi

# ---- 测试 SSH ----
log "测试 SSH 连接到 ${SERVER_USER}@${SERVER_HOST}..."
if ! ${SSH_CMD} "${SERVER_USER}@${SERVER_HOST}" "echo SSH_OK" >/dev/null 2>&1; then
    log "错误: 无法 SSH 连接到服务器"
    exit 1
fi
log "SSH 连接成功"

# ---- 步骤 1: 备份服务器数据库 ----
log "备份服务器数据库..."
BACKUP_FILE="/tmp/server_backup_$(date +%Y%m%d_%H%M%S).sql"

if ${SSH_CMD} "${SERVER_USER}@${SERVER_HOST}" \
    "docker compose -f ${SERVER_COMPOSE_FILE} exec -T mysql \
     mysqldump -u iqair -p\"${SERVER_DB_PASS}\" --default-character-set=utf8mb4 \
     --single-transaction --routines --triggers --no-tablespaces iqair_workbench" \
    > "${BACKUP_FILE}" 2>/dev/null; then
    BACKUP_SIZE=$(wc -c < "${BACKUP_FILE}" 2>/dev/null || echo 0)
    log "服务器数据库备份完成 (${BACKUP_SIZE} bytes)"
else
    log "警告: 服务器数据库备份失败，继续推送..."
fi

# ---- 步骤 2: 推送本地数据库到服务器 ----
log "开始推送本地数据库到服务器..."
START_TIME=$(date +%s)

# 本地 mysqldump，管道直接导入服务器 MySQL
if mysqldump -h "${LOCAL_DB_HOST}" -P "${LOCAL_DB_PORT}" \
    -u root -p"${LOCAL_ROOT_PASS}" \
    --default-character-set=utf8mb4 \
    --single-transaction --routines --triggers --no-tablespaces \
    --add-drop-table \
    "${LOCAL_DB_NAME}" \
    | ${SSH_CMD} "${SERVER_USER}@${SERVER_HOST}" \
    "docker compose -f ${SERVER_COMPOSE_FILE} exec -T mysql \
     mysql -u iqair -p\"${SERVER_DB_PASS}\" --default-character-set=utf8mb4 \"${LOCAL_DB_NAME}\"" 2>/tmp/push_err.log; then

    ELAPSED=$(($(date +%s) - START_TIME))
    log "数据库推送成功 (耗时 ${ELAPSED}s)"
else
    log "错误: 数据库推送失败"
    cat /tmp/push_err.log 2>/dev/null | tee -a "$LOG_FILE"
    log "尝试从备份恢复服务器数据库..."
    if [ -s "${BACKUP_FILE}" ]; then
        cat "${BACKUP_FILE}" | ${SSH_CMD} "${SERVER_USER}@${SERVER_HOST}" \
            "docker compose -f ${SERVER_COMPOSE_FILE} exec -T mysql \
             mysql -u iqair -p\"${SERVER_DB_PASS}\" --default-character-set=utf8mb4 \"${LOCAL_DB_NAME}\"" 2>/dev/null
    fi
    log "已尝试恢复，请检查服务器状态"
    exit 1
fi

# ---- 步骤 3: 同步文件到服务器 ----
log "开始推送文件..."
${SSH_CMD} "${SERVER_USER}@${SERVER_HOST}" "mkdir -p ${SERVER_COMPOSE_FILE%/*}/data/media ${SERVER_COMPOSE_FILE%/*}/data/snapshots"

rsync -avz --timeout=60 \
    -e "${SSH_CMD}" \
    /sync/data/media/ \
    "${SERVER_USER}@${SERVER_HOST}:${SERVER_COMPOSE_FILE%/*}/data/media/" 2>/dev/null && \
    log "media 推送完成" || log "media 推送失败（非致命）"

rsync -avz --timeout=60 \
    -e "${SSH_CMD}" \
    /sync/data/snapshots/ \
    "${SERVER_USER}@${SERVER_HOST}:${SERVER_COMPOSE_FILE%/*}/data/snapshots/" 2>/dev/null && \
    log "snapshots 推送完成" || log "snapshots 推送失败（非致命）"

# ---- 步骤 4: 在服务器上执行 migrate 和重启 ----
log "在服务器上执行数据库迁移..."
${SSH_CMD} "${SERVER_USER}@${SERVER_HOST}" \
    "cd ${SERVER_COMPOSE_FILE%/*} && docker compose -f ${SERVER_COMPOSE_FILE} exec -T backend python manage.py migrate --noinput" 2>/dev/null && \
    log "服务器 migrate 完成" || log "服务器 migrate 失败（可能已是最新）"

log "重启服务器后端..."
${SSH_CMD} "${SERVER_USER}@${SERVER_HOST}" \
    "cd ${SERVER_COMPOSE_FILE%/*} && docker compose -f ${SERVER_COMPOSE_FILE} restart backend" 2>/dev/null && \
    log "服务器后端重启完成" || log "服务器重启失败"

# ---- 清理 ----
rm -f "${BACKUP_FILE}" /tmp/push_err.log

log "========== 推送完成 =========="
log "服务器备份保留在: ${BACKUP_FILE} (如需恢复请登录服务器)"
