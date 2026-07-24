FROM alpine:3.20

# Install sync tools: mysql-client, openssh, rsync, bash, sshpass
# Cron uses busybox crond (not dcron) to avoid setpgid issues in Docker
RUN apk add --no-cache \
    mysql-client \
    openssh-client \
    rsync \
    bash \
    sshpass \
    && mkdir -p /sync/logs /sync/data/media /sync/data/snapshots

# Configure crontab: hourly sync
RUN echo "0 * * * * /sync/sync-db.sh >> /sync/logs/cron.log 2>&1" > /etc/crontabs/root

# Copy sync script (overridden by bind mount in docker-compose.override.yml)
COPY --chmod=0755 sync-db.sh /sync/sync-db.sh

# Run busybox crond in foreground
CMD ["crond", "-f", "-l", "8"]