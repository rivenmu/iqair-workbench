# RIVEN 数据分析工作台

基于 Vue 3 + Django 5 + MySQL 8 + Redis 的企业级数据分析平台，采用苹果简约设计风格。

## 技术栈

- **前端**: Vue 3 + Vite + TypeScript + Pinia + Element Plus + ECharts
- **后端**: Django 5 + DRF + Celery + Channels + SimpleUI
- **数据库**: MySQL 8.0 + Redis 7
- **部署**: Docker Compose + Volume 挂载（支持 Remote-SSH 热更新）

## 快速开始

### 一、服务器环境准备（PVE Ubuntu）

#### 1. 安装 Docker 和 Docker Compose

```bash
# 更新包索引
sudo apt update

# 安装必要依赖
sudo apt install -y ca-certificates curl gnupg lsb-release

# 添加 Docker 官方 GPG 密钥
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 添加 Docker 仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 将当前用户加入 docker 组（免 sudo）
sudo usermod -aG docker $USER

# 重新登录使组权限生效
exit
# 重新 SSH 登录

# 验证安装
docker --version
docker compose version
```

#### 2. 安装 Nginx（用于域名反向代理）

```bash
sudo apt install -y nginx
```

### 二、部署项目

#### 1. 上传项目代码

将整个 `iqair-workbench` 目录上传到服务器，例如放到 `/opt/iqair-workbench`：

```bash
# 在服务器创建目录
mkdir -p /opt/iqair-workbench

# 通过 Trae Remote-SSH 直接在服务器上编辑
# 或使用 scp 上传
scp -r ./v2/iqair-workbench/* user@10.0.0.6:/opt/iqair-workbench/
```

#### 2. 配置环境变量

```bash
cd /opt/iqair-workbench

# 复制环境变量模板
cp .env.example .env

# 编辑环境变量（修改密码等敏感信息）
nano .env
```

#### 3. 启动服务

```bash
# 构建并启动所有服务
docker compose up -d --build

# 查看运行状态
docker compose ps

# 查看日志
docker compose logs -f
```

#### 4. 初始化数据库

首次启动会自动执行：
- Django migrations
- 创建管理员账户 (admin/admin123)
- 创建默认项目数据

#### 5. 配置 Nginx 域名代理

```bash
# 复制 Nginx 配置
sudo cp /opt/iqair-workbench/nginx/iqair.conf /etc/nginx/sites-available/

# 启用站点
sudo ln -s /etc/nginx/sites-available/iqair.conf /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

### 三、访问地址

| 地址 | 说明 |
|------|------|
| http://10.0.0.6:8888 | RIVEN 网址导航首页 |
| http://10.0.0.6:8888/index.html | 同上（显式 index.html） |
| http://10.0.0.6:8000/admin/ | Django 管理后台（SimpleUI 中文界面） |
| http://10.0.0.6:8000/api/ | 后端 API |
| http://iqair.rivenmu.cn:20001 | 域名访问（需配置 Nginx 和 DNS） |

### 四、默认账户

- **用户名**: admin
- **密码**: admin123

> 首次登录后请立即在「个人设置」中修改密码

## 开发模式（Remote-SSH 热更新）

### 工作流程

1. **使用 Trae Remote-SSH 连接到服务器**

2. **修改代码后自动生效**：
   - 前端 Vue 代码：Vite HMR 自动热更新，无需重启
   - 后端 Django 代码：Daphne 自动检测文件变化并重载
   - 数据模型变更：需要手动执行 migrations

3. **需要重启服务的场景**：
   ```bash
   # 修改了 requirements.txt（新增 Python 依赖）
   docker compose restart backend celery-worker celery-beat

   # 修改了 package.json（新增 npm 依赖）
   docker compose restart frontend

   # 修改了 docker-compose.yml
   docker compose up -d

   # 数据模型变更
   docker compose exec backend python manage.py makemigrations
   docker compose exec backend python manage.py migrate
   ```

### 目录说明

```
/opt/iqair-workbench/
├── docker-compose.yml      # Docker 编排
├── .env                    # 环境变量
├── backend/                # 后端代码（挂载到容器，保存即生效）
├── frontend/               # 前端代码（挂载到容器，HMR 热更新）
├── data/                   # 数据持久化
│   ├── mysql/              # MySQL 数据
│   ├── redis/              # Redis 数据
│   ├── snapshots/          # 快照文件
│   └── logs/               # 日志
└── nginx/                  # Nginx 配置
```

## 功能特性

### 核心功能
- ✅ RIVEN 网址导航页（左右分栏布局，5大功能区块）
- ✅ 苹果简约风格 UI 设计（毛玻璃/卡片/微动画）
- ✅ JWT 认证 + 自动刷新 Token
- ✅ 用户权限管理（管理员/普通用户）
- ✅ 网址收藏功能（红心收藏，未登录跳转登录页）
- ✅ 管理员网址管理（添加/删除/编辑/图标上传）
- ✅ Django SimpleUI 管理后台（中文界面）
- ✅ IQAir 数据看板（双模态编辑 + ECharts 图表）
- ✅ 数据快照系统（混合存储：MySQL + 文件系统）
- ✅ 操作审计日志（90天保留，7天后每天保留最后一条）
- ✅ 撤销功能（多级撤销）
- ✅ Celery 异步任务（快照清理、日志清理）

### 导航分类
1. 我的收藏（动态生成，需登录）
2. 工作站点（IQAir 数据看板等）
3. 个人站点
4. 实用工具
5. AI工具

## 常见问题

### Q: 如何查看容器日志？
```bash
docker compose logs -f backend    # 后端日志
docker compose logs -f frontend   # 前端日志
docker compose logs -f mysql      # 数据库日志
```

### Q: 如何进入容器执行命令？
```bash
docker compose exec backend bash
docker compose exec frontend sh
```

### Q: 如何备份数据？
```bash
# 备份 MySQL
docker compose exec mysql mysqldump -u root -p iqair_workbench > backup.sql

# 备份快照文件
tar -czf snapshots_backup.tar.gz data/snapshots/
```

### Q: 如何更新代码？
```bash
# 通过 Trae Remote-SSH 直接修改服务器上的文件
# 修改后前端自动热更新，后端自动重载
# 如需手动重启：
docker compose restart backend
```

## 许可证

私有项目，版权所有 © 2026 Riven
