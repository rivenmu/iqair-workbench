FROM node:20-alpine

WORKDIR /app/frontend

# package.json 通过 Volume 挂载，开发模式下在容器内 npm install
# 这样保证 node_modules 在 Linux 文件系统中（避免 Windows 文件系统差异）

EXPOSE 8888

CMD ["sh", "-c", "npm install && npm run dev -- --host 0.0.0.0 --port 8888"]
