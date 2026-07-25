# RIVEN 数据分析工作台

基于 Vue 3 + Django 5 + MySQL 8 + Redis 的企业级数据分析平台，采用苹果简约设计风格。

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | Vue 3 + Vite + TypeScript + Pinia + Element Plus + ECharts |
| **后端** | Django 5 + DRF + Celery + Channels + SimpleUI |
| **服务** | Gunicorn (WSGI) + WhiteNoise (静态文件) |
| **数据库** | MySQL 8.0 + Redis 7 |
| **部署** | Docker Compose + Nginx 反向代理 |

## 项目结构

```
iqair-workbench/
├── docker-compose.yml          # Docker 编排（统一开发/生产配置）
├── deploy.sh                   # 生产环境首次部署脚本
├── update.sh                   # 日常更新脚本（备份+拉代码+重建）
├── .env.example                # 开发环境变量模板
├── .env.prod.example           # 生产环境变量模板
├── AGENTS.md                   # AI Agent 开发规范
│
├── backend/                    # Django 后端
│   ├── Dockerfile              # 后端镜像（Python 3.11 + Gunicorn）
│   ├── requirements.txt        # Python 依赖
│   ├── manage.py
│   ├── config/                 # Django 配置、URL、Celery、ASGI/WSGI
│   ├── apps/                   # Django 应用模块
│   │   ├── accounts/           # 用户认证与权限
│   │   ├── projects/           # 项目管理
│   │   ├── dashboard/          # 数据看板（含 UI 文本配置）
│   │   ├── snapshots/          # 数据快照
│   │   ├── audit/              # 操作审计日志
│   │   └── navigation/         # 网址导航
│   ├── services/               # 业务逻辑层
│   ├── tasks/                  # Celery 异步任务
│   └── utils/                  # 工具函数
│
├── frontend/                   # Vue 3 前端
│   ├── Dockerfile              # 多阶段构建（dev / build / prod）
│   ├── nginx.conf              # 前端 Nginx 配置（生产环境）
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.ts             # 入口
│       ├── App.vue
│       ├── api/                # API 客户端（auth, dashboard, navigation, projects）
│       ├── components/         # 通用组件
│       ├── layouts/            # 布局组件（MainLayout, WorkbenchLayout）
│       ├── router/             # Vue Router 路由
│       ├── stores/             # Pinia 状态管理
│       ├── styles/             # SCSS 样式（tokens, global, element-overrides）
│       └── views/
│           ├── Navigation.vue      # 网址导航首页
│           ├── Login.vue           # 登录页
│           ├── Register.vue        # 注册页
│           ├── Profile.vue         # 个人设置
│           ├── UserManagement.vue  # 用户管理
│           └── dashboard/          # 数据看板面板
│               ├── IQAirDashboard.vue    # 主看板
│               ├── IQAirDataPanel.vue    # 数据面板
│               ├── IQAirCompetitor.vue   # 竞品对比
│               ├── AirQualityPanel.vue   # 空气质量
│               ├── GenericPanel.vue      # 通用面板
│               ├── DailyPanel.vue        # 日报
│               ├── WeeklyPanel.vue       # 周报
│               ├── SalesPanel.vue        # 销售数据
│               └── CiYunPanel.vue        # 词云
│
├── nginx/                      # 宿主机 Nginx 配置
│   └── iqair.conf              # 域名反向代理（含 /bi/ DataEase 代理）
│
├── data/                       # 数据持久化（不提交 Git）
│   ├── mysql/                  # MySQL 数据
│   ├── redis/                  # Redis 数据
│   ├── snapshots/              # 快照文件
│   └── logs/                   # 日志
│
├── uploadfiles/                # 上传文件（不提交 Git）
└── backups/                    # 数据库备份（update.sh 自动生成）
```

## 快速开始

### 一、环境准备

#### 1. 安装 Docker

```bash
# 更新包索引
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release

# 添加 Docker 官方 GPG 密钥和仓库
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 将当前用户加入 docker 组（免 sudo）
sudo usermod -aG docker $USER
# 退出重新登录生效
```

#### 2. 安装 Nginx（域名反向代理，可选）

```bash
sudo apt install -y nginx
```

### 二、部署

#### 1. 拉取项目代码

```bash
git clone <repo-url> /opt/iqair-workbench
cd /opt/iqair-workbench
```

#### 2. 配置环境变量

```bash
# 开发环境
cp .env.example .env
# 生产环境
cp .env.prod.example .env
```

编辑 `.env`，修改数据库密码、SECRET_KEY 等敏感信息。

#### 3. 启动服务

```bash
# 构建并启动所有服务
docker compose up -d --build

# 查看运行状态
docker compose ps

# 查看日志
docker compose logs -f
```

启动后会自动执行数据库迁移、创建管理员账户、收集静态文件。

#### 4. 配置域名访问（可选）

```bash
# 复制 Nginx 配置
sudo cp /opt/iqair-workbench/nginx/iqair.conf /etc/nginx/sites-available/

# 启用站点
sudo ln -s /etc/nginx/sites-available/iqair.conf /etc/nginx/sites-enabled/

# 测试并重载
sudo nginx -t && sudo systemctl reload nginx
```

### 三、访问地址

| 地址 | 说明 |
|------|------|
| http://10.0.0.6:8888 | 网址导航首页 |
| http://10.0.0.6:8000/api/ | 后端 API |
| http://10.0.0.6:8000/admin/ | Django 管理后台（SimpleUI） |
| http://iqair.rivenmu.cn:20001 | 域名访问（需 Nginx + DNS） |

### 四、默认账户

- **用户名**: admin
- **密码**: admin123

> 首次登录后请在「个人设置」中修改密码。

## 日常运维

### 更新代码

```bash
./update.sh
```

该脚本会自动：
1. 备份数据库到 `backups/` 目录
2. 拉取最新代码（Git pull）
3. 重新构建并重启 Docker 服务
4. 清理旧镜像
5. 检查服务状态

### 常用命令

```bash
# 查看各服务日志
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f celery-worker
docker compose logs -f mysql

# 进入容器
docker compose exec backend bash
docker compose exec frontend sh

# 执行 Django 命令
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py check

# 重启服务
docker compose restart backend
docker compose restart frontend

# 停止所有服务
docker compose down
```

### 数据备份

```bash
# MySQL 备份（务必加 charset 参数，否则中文乱码）
docker compose exec mysql mysqldump -u root -p --default-character-set=utf8mb4 iqair_workbench > backup.sql

# 快照文件备份
tar -czf snapshots_backup.tar.gz data/snapshots/
```

## 功能特性

### 核心功能
- 网址导航页（左右分栏布局，5 大功能区块）
- 苹果简约风格 UI（毛玻璃 / 卡片 / 微动画）
- JWT 认证 + 自动刷新 Token + Token 黑名单
- 用户权限管理（管理员 / 普通用户）
- 网址收藏功能（红心收藏，未登录跳转登录页）
- 管理员网址管理（添加 / 删除 / 编辑 / 图标上传）
- Django SimpleUI 管理后台（中文界面）
- IQAir 数据看板（多面板 + ECharts 图表）
- 词云页面（echarts-wordcloud）
- 数据快照系统（MySQL + 文件系统混合存储）
- 操作审计日志（90 天保留，7 天后按天合并）
- 撤销功能（多级撤销）
- Celery 异步任务（快照清理、日志清理）
- DataEase BI 看板集成（/bi/ 反向代理）

### 导航分类
1. 我的收藏（动态生成，需登录）
2. 工作站点（IQAir 数据看板等）
3. 个人站点
4. 实用工具
5. AI 工具

## 开发说明

### 后端

- **框架**: Django 5 + Django REST Framework
- **认证**: JWT（SimpleJWT）+ Token 黑名单
- **异步**: Celery（Redis Broker）+ Celery Beat 定时任务
- **WebSocket**: Django Channels + Redis Channel Layer
- **静态文件**: WhiteNoise（压缩 + 缓存）
- **API 文档**: drf-spectacular（OpenAPI Schema）
- **后台管理**: SimpleUI 主题
- **数据库**: MySQL 8.0（utf8mb4）

### 前端

- **框架**: Vue 3（Composition API）+ TypeScript
- **构建**: Vite
- **UI 库**: Element Plus
- **图表**: ECharts + vue-echarts + echarts-wordcloud
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP**: Axios（统一拦截器、自动刷新 Token）
- **进度条**: NProgress
- **样式**: SCSS（设计令牌系统 + Element Plus 覆写）
- **字体**: Alibaba PuHuiTi（中文）+ Inter（英文）

### Docker 多阶段构建

前端 Dockerfile 支持三阶段构建：

```bash
# 开发模式（Vite HMR 热更新）
docker compose up -d --build

# 生产模式（Nginx 静态文件）
# Dockerfile 中 target: prod 阶段
```

后端使用 Gunicorn (WSGI) + WhiteNoise 提供静态文件服务。

### 环境变量说明

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `MYSQL_ROOT_PASSWORD` | MySQL root 密码 | - |
| `MYSQL_DATABASE` | 数据库名 | `iqair_workbench` |
| `MYSQL_USER` | 数据库用户 | `iqair` |
| `MYSQL_PASSWORD` | 数据库密码 | - |
| `REDIS_PASSWORD` | Redis 密码 | - |
| `DJANGO_SECRET_KEY` | Django 密钥 | - |
| `DEBUG` | 调试模式 | `False` |
| `ALLOWED_HOSTS` | 允许的主机 | `*` |
| `CSRF_TRUSTED_ORIGINS` | CSRF 信任源 | `http://localhost:8888` |
| `VITE_API_BASE_URL` | 前端 API 地址 | - |
| `VITE_APP_TITLE` | 应用标题 | `IQAir 数据分析工作台` |
| `CELERY_WORKERS` | Celery 并发数 | `2` |

---

## 环境切换高危提醒

> 本项目的 `docker-compose.yml` 由本地开发环境和服务器生产环境共用。
> 下方操作极易导致一端正常运行、另一端崩溃，修改前务必对照检查。

### P0 致命修改（改前必读）

1. **修改 docker-compose.yml 的端口或网络**
   - 影响：Nginx 反向代理、Vite proxy、update.sh mysqldump 全部依赖端口映射
   - 检查：改后必须确认 `nginx/iqair.conf` 的 proxy_pass 端口、`vite.config.ts` 的 proxy target、`update.sh` 的 mysqldump 端口三者一致

2. **修改 settings.py 的数据库默认值**
   - 影响：一个环境必然连不上数据库
   - 检查：保持 `os.environ.get()` 模式，不要硬编码 HOST/PORT/PASSWORD

3. **改服务器 MySQL 密码但未更新 update.sh**
   - 影响：mysqldump 备份失败，同步容器拉取失效
   - 检查：`update.sh` 第 38 行硬编码密码、同步容器的 SYNC_SERVER_DB_PASSWORD 需同步修改

4. **删除 docker-compose.override.yml**
   - 影响：本地热重载、环境识别、数据库同步全部失效
   - 恢复：从 `docker-compose.override.example.yml` 复制并填入本地密码

### P1 高危修改

5. **修改 vite.config.ts proxy** — 保持 `env.VITE_API_BASE_URL || 'http://10.0.0.6:8000'` 模式，不硬编码 localhost
6. **修改 Dockerfile** — 本地先 `docker compose build` 验证再 push
7. **修改 Celery beat_schedule** — 新任务内部用 `is_production()` 守卫，避免本地任务在生产报错
8. **数据库迁移** — 迁移文件必须提交到 git 并在两端同步执行，绝不手动在生产跑 migrate
9. **MySQL 命令行操作** — 直接通过 `mysql` CLI 操作数据库时，务必加 `--default-character-set=utf8mb4` 参数，否则中文会变成乱码。通过 Django Admin 或 API 操作则无需担心（Django 自动使用 UTF-8 连接）

### P2 中危修改

9. **修改 .gitignore** — 验证 `docs/` 已入库、`.env` 和 `override.yml` 仍被忽略
10. **修改 CSRF_TRUSTED_ORIGINS** — 确认列表同时包含生产域名（10.0.0.6、iqair.rivenmu.cn）和本地（localhost）
11. **新增 pip 依赖** — 及时更新 `requirements.txt`，否则生产 build 缺少包
12. **修改 nginx/iqair.conf** — 生产域名配置，改后先在生产 `nginx -t` 验证

---

## 后续开发注意事项

### 环境自适应原则

本项目采用零干预环境识别：代码自动判断本地/生产，无需手动设置环境标记。

- 判断环境：`from utils.env_detect import is_local, is_production`
- 环境差异：只通过 `os.environ.get()` 和 `.env` 注入，不入库
- 本地独有配置：只放在 `docker-compose.override.yml`（已被 gitignore）

### 推送前检查清单

1. `git status` 确认未误提交 `.env`、`venv/`、`node_modules/` 等敏感文件
2. `git diff` 确认未意外改动 `docker-compose.yml`、`update.sh` 等生产关键文件
3. 确认新增的数据库迁移文件已包含在本次提交中
4. `docker compose up -d --build` 本地完整启动通过
5. 访问 `localhost:8888` 和 `/admin` 确认功能正常

### 部署后检查清单

1. `docker compose ps` 所有服务 Up
2. `docker compose logs --tail=50 backend` 无 ERROR
3. 访问生产域名确认前端加载
4. 访问 `/admin` 确认后台显示"服务器生产"（非"本地"）
5. 确认"拉取服务器数据库"按钮不显示

### 本地同步异常时

```
docker compose exec backend python -c "from utils.env_detect import get_env_info; print(get_env_info())"
docker compose logs db-sync
```

确认 SSH 可连接服务器且密码与 `update.sh` 一致。


## 许可证

私有项目，版权所有 &copy; 2026 Riven
