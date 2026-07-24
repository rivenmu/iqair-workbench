FROM alpine:3.20

# 安装同步所需工具: mysql-client, openssh, rsync, cron
# sshpass 用于密码认证（可选，优先使用 SSH 密钥）
RUN apk add --no-cache \
    mysql-client \
    openssh-client \
    rsync \
    dcron \
    bash \
    sshpass \
    && mkdir -p /sync/logs /sync/data/media /sync/data/snapshots

# 配置 crontab：每小时整点执行同步脚本
RUN echo "0 * * * * /sync/sync-db.sh >> /sync/logs/cron.log 2>&1" > /etc/crontabs/root

# 确保脚本可执行
COPY --chmod=0755 sync-db.sh /sync/sync-db.sh

# 启动 cron 前台运行
CMD ["crond", "-f", "-l", "2"]
