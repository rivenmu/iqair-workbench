# IQAir Workbench 本地开发与数据库同步方案

> 版本：v1.0
> 日期：2026-07-24
> 状态：待实施

---

## 一、目标

- **本机 Docker 运行与测试**：通过 `localhost:8888` 访问前端，完整启动全部服务
- **生产完全不变**：`git push` 推送到服务器后，生产环境 `update.sh` 流程照常运行，无需任何改变
- **代码入 git，密钥不入 git**：除环境依赖包（`venv/`、`node_modules/`、`dist/`）和敏感文件（`.env`）外，所有源码、配置、manifest、文档加入 git 管理
- **本地测试数据库与服务器准实时同步**：每小时自动从服务器拉取最新数据库 + 文件覆盖本地
- **后台环境感知 + 一键拉取**：Django Admin 新增栏目检测当前运行环境（本地/服务器），并提供"拉取服务器数据库到本地"的功能按钮

---

## 二、关键决策（已与 Riven 确认）

| 决策点 | 选择 | 说明 |
|--------|------|------|
| 数据库同步模式 | 本地独立可写库 + 每小时 dump 覆盖 | 生产 MySQL **零改动**，本地完全可写 |
| 同步方向 | 服务器 -> 本地（单向） | 本地写操作不会同步回服务器 |
| 同步频率 | 每小时自动 + 手动触发 | 后台按钮可随时手动触发 |
| 同步发起方 | 本地发起 SSH 拉取 | 服务器不增加任何服务 |
| 文件同步范围 | `data/media/` + `data/snapshots/` | rsync 增量同步 |
| git 入库范围 | 代码 + manifest + docs；密钥不入 | `.env` 系列保持本地维护 |
| 生产变更 | 无 | 不改生产 MySQL、不启用 binlog、不开复制账号 |
| 网络条件 | 本机与服务器同一内网可直连 | 本机可 SSH 到 `10.0.0.6` |

---

## 三、实施总览

本方案分五个部分：

1. **git 整理**：修正 `.gitignore`，将代码和 docs 纳入版本控制，密钥与依赖保持忽略
2. **多环境 compose**：用 `docker-compose.override.yml`（被 gitignore）承载本地差异，生产 compose 不动
3. **数据同步服务**：新增轻量同步容器，cron 每小时拉取服务器数据库 + 文件
4. **Django 后台环境感知 + 拉取功能**：Admin 新增"系统环境"栏目
5. **文档与验证**：完整测试流程

---

## 四、git 整理

### 4.1 `.gitignore` 修改

**核心原则**：环境差异只通过 `.env` 和 `docker-compose.override.yml`（不入库）注入，git 仓库里的所有文件保持环境无关。

修改 `.gitignore`，变更如下：

- 移除 `docs/` 和 `agent.md` 的忽略行（docs 现在纳入 git 管理）
- 新增前端编译产物忽略：`*.vue.js`、`tsconfig.node.tsbuildinfo`、`tsconfig.tsbuildinfo`、`vite.config.d.ts`
- 新增一次性脚本忽略：`backend/set_password.py`
- 新增备份文件忽略：`backend/requirements.txt.backup`、`frontend/src/views/Navigation.vue.backup`
- 已有忽略项保持不变：`.env*`、`backend/venv/`、`frontend/node_modules/`、`frontend/dist/`、`__pycache__/`、`docker-compose.override.yml`、`data/*`、`backups/`

### 4.2 入库范围对照

| 入库 | 不入库 |
|------|--------|
| `docker-compose.yml`（生产用，环境无关） | `.env`（含密码） |
| `docker-compose.override.example.yml`（本地示例模板） | `docker-compose.override.yml`（实际本地配置） |
| `backend/` 全部源码 + `requirements.txt` + `Dockerfile` | `backend/venv/` / `__pycache__/` / `backend/.env` |
| `frontend/` 全部源码 + `package.json` + `vite.config.ts` + `Dockerfile` | `frontend/node_modules/` / `frontend/dist/` / `*.vue.js` |
| `nginx/iqair.conf` / `frontend/nginx.conf` | `backups/` / `data/*.sql` |
| `update.sh` / `README.md` / `AGENTS.md` / `docs/**` | `backend/set_password.py` / `requirements.txt.backup` |

### 4.3 `update.sh` 硬编码密码

当前 `update.sh` 第 38 行硬编码了生产密码。本方案**不修改**此文件（保证生产不变）。但需要在本地 `.env` 中配置与服务器生产一致的密码才能 dump。这是现有遗留问题，不影响本方案运行。

---

## 五、多环境 Docker Compose

### 5.1 策略：override 文件分离本地差异

- `docker-compose.yml`（入库）：生产用，环境无关，**不做任何修改**
- `docker-compose.override.yml`（不入库，gitignore）：本地专用，覆盖生产 compose 的差异部分
- `docker-compose.override.example.yml`（入库）：本地 override 的示例模板，供新环境参考

Docker Compose 默认行为：若目录中存在 `docker-compose.override.yml`，`docker compose up` 会自动将两者合并。服务器上无此文件，自动只跑基础 compose，生产完全不受影响。

### 5.2 `docker-compose.override.example.yml` 内容

本地 override 需要覆盖的差异：

- `backend`：新增 `DEPLOY_ENV: local` 和 `SYNC_*` 环境变量；挂载源码实现热重载
- `frontend`：`VITE_API_BASE_URL` 指向 `localhost:8000`；挂载源码实现热重载
- 新增 `db-sync-cron` 容器：每小时自动执行 dump + rsync

### 5.3 `DEPLOY_ENV` 环境变量约定

| 值 | 含义 | 用途 |
|----|------|------|
| `local` | 本地开发环境 | Django Admin 显示"本地"，启用同步功能 |
| `production` | 服务器生产环境 | Django Admin 显示"生产"，隐藏同步功能 |
| 未设置 | 默认视为 `production` | 保证生产不显式配置也不受影响 |

在 `docker-compose.yml`（生产）中**不设置** `DEPLOY_ENV`，在 `docker-compose.override.yml`（本地）中设置 `DEPLOY_ENV: local`。

---

## 六、数据同步服务

### 6.1 同步原理

1. 本地同步容器通过 SSH 连接到服务器 `10.0.0.6`
2. 在服务器上执行 `docker compose exec mysql mysqldump` 导出数据库
3. 通过 SSH 管道将 dump 流传输到本地
4. 恢复到本地 MySQL 容器
5. rsync 同步 `data/media/` 和 `data/snapshots/`

整个过程服务器端不增加任何服务、不修改任何配置。

### 6.2 `scripts/sync-db.sh` 脚本

新增 `scripts/sync-db.sh`（入库），要点：

- 从环境变量读取服务器地址、用户、密码
- 通过 SSH 在远程执行 `mysqldump`，管道直接导入本地 MySQL
- rsync 同步 media 和 snapshots 目录
- 记录同步日志

### 6.3 同步容器

新增 `scripts/sync/Dockerfile`（入库）：基于 alpine，安装 `mysql-client` + `openssh` + `rsync` + `cron`。

`db-sync-cron` 容器在 `docker-compose.override.yml` 中定义：

- `restart: unless-stopped`
- 挂载 `scripts/sync-db.sh`、`data/media`、`data/snapshots`、`~/.ssh`
- cron 配置 `0 * * * * /sync/sync-db.sh`（每小时整点执行）
- 与 backend 共享同一网络，可通过容器名访问 `iqair-mysql`

### 6.4 同步注意事项

- 本地测试创建/修改的数据会在下次同步时被**覆盖**（因为是 dump 恢复）
- 同步过程中后端可能短暂出现数据库不一致，建议在同步前确保没有大型写事务
- rsync `--delete` 会删除本地有但服务器没有的文件，保证与服务器一致
- SSH 需要本机能免密登录服务器（`ssh-copy-id` 配置密钥）

---

## 七、Django 后台环境感知 + 拉取功能

### 7.1 后台栏目设计

在 Django SimpleUI 后台新增"系统环境"栏目，位于 Admin 首页：

- 当前环境：本地开发 / 服务器生产
- 服务器地址：10.0.0.6（仅本地显示）
- 最后同步时间：2026-07-24 15:00:00（仅本地显示）
- 同步状态：待同步 / 同步中 / 同步成功 / 同步失败
- "拉取服务器数据库到本地"按钮（仅本地环境可见）

### 7.2 新增 Django app：`backend/apps/system_env/`

新增文件：

- `__init__.py` / `apps.py`：Django app 配置
- `models.py`：`SyncRecord` 模型（记录同步历史：时间、状态、耗时、错误信息、触发方式）
- `admin.py`：SimpleUI 自定义 Admin 视图，首页注入环境信息面板
- `views.py`：拉取数据库的 AJAX 接口
- `urls.py`：URL 路由
- `services.py`：同步服务逻辑（通过 `subprocess` 调用同步脚本）
- `migrations/0001_initial.py`：数据库迁移
- `templates/system_env_panel.html`：后台面板模板

### 7.3 `settings.py` 变更

- `INSTALLED_APPS` 添加 `'apps.system_env'`
- 末尾新增环境识别配置：`DEPLOY_ENV = os.environ.get('DEPLOY_ENV', 'production')`、`SYNC_SERVER_HOST`、`SYNC_ENABLED`

### 7.4 `config/urls.py` 变更

添加 `path('api/system-env/', include('apps.system_env.urls'))`

### 7.5 同步逻辑

后端通过 Django 调用 Docker 命令触发同步（`subprocess` 调用 `sync-db.sh`）：

- 创建 `SyncRecord`，状态 `running`
- 执行 `docker exec iqair-db-sync /sync/sync-db.sh`
- 成功则状态 `success`，失败则 `failed` 并记录错误
- 返回 JSON 响应给前端

### 7.6 权限

- 同步功能仅在 `DEPLOY_ENV == 'local'` 时可用
- 生产环境面板不显示拉取按钮，接口返回 403

---

## 八、环境变量完整对照

### 8.1 生产 `.env`（服务器，不入库）

保持现有内容，无需新增任何变量。

### 8.2 本地 `.env`（不入库）

在现有本地 `.env` 基础上新增：

- `DEPLOY_ENV=local`
- `SYNC_SERVER_HOST=10.0.0.6`
- `SYNC_SERVER_USER=root`
- `SYNC_SERVER_DB_PASSWORD=<服务器生产 DB 密码>`

### 8.3 变量流向

- `docker-compose.yml`（入库，环境无关）：不含 `DEPLOY_ENV`，默认 `production`
- 生产无 override：`DEPLOY_ENV` 未设置 -> `production` -> 后台显示"生产"，同步功能隐藏
- 本地有 override：`DEPLOY_ENV=local` -> 后台显示"本地"，同步功能激活

---

## 九、完整文件变更清单

### 新增文件（入库）

- `docs/local-dev-sync-plan.md`：本文档
- `docker-compose.override.example.yml`：本地 override 示例模板
- `scripts/sync-db.sh`：数据库 + 文件同步脚本
- `scripts/sync/Dockerfile`：同步 cron 容器镜像
- `backend/apps/system_env/`：系统环境模块（含 `__init__.py`、`apps.py`、`models.py`、`admin.py`、`views.py`、`urls.py`、`services.py`、`migrations`、`templates`）

### 修改文件（入库）

- `.gitignore`：移除 `docs/` 忽略；新增前端编译产物、`.vue.js`、`tsbuildinfo`、`set_password.py`、`requirements.txt.backup` 等忽略
- `backend/config/settings.py`：`INSTALLED_APPS` 加 `apps.system_env`；末尾加 `DEPLOY_ENV` / `SYNC_*` 配置
- `config/urls.py`（即 `backend/config/urls.py`）：加 `system_env` URL include

### 不入库文件（gitignore 保持）

- `.env` / `backend/.env`：含密码
- `docker-compose.override.yml`：本地专属，含服务器密码
- `backend/venv/` / `frontend/node_modules/` / `frontend/dist/`：依赖包
- `data/mysql/*` / `backups/*`：数据与备份

### 生产不变文件（不修改）

- `docker-compose.yml`：完全不修改
- `update.sh`：完全不修改
- `backend/Dockerfile` / `frontend/Dockerfile`：完全不修改
- `nginx/iqair.conf`：完全不修改

---

## 十、实施步骤

### 第一步：git 整理 + override 基础设施

1. 修改 `.gitignore`，移除 `docs/` 忽略行
2. 新增前端编译产物忽略规则
3. 创建 `docker-compose.override.example.yml`
4. 复制为 `docker-compose.override.yml`（不入库），填入本地密码
5. `git add` 全部应入库文件，提交

### 第二步：数据同步脚本 + 容器

1. 创建 `scripts/sync-db.sh`
2. 创建 `scripts/sync/Dockerfile`（alpine + mysql-client + openssh + rsync + cron）
3. 在 `docker-compose.override.yml` 中加 `db-sync-cron` 容器
4. 配置 SSH 免密登录服务器
5. 手动测试一次：`sh scripts/sync-db.sh`

### 第三步：Django 后台环境感知 + 拉取功能

1. 创建 `backend/apps/system_env/` 全部文件
2. 修改 `settings.py`：加 `INSTALLED_APPS` + `DEPLOY_ENV` 配置
3. 修改 `config/urls.py`：加路由
4. 生成迁移：`python manage.py makemigrations system_env`
5. 运行迁移：`python manage.py migrate`
6. 后台测试：访问 `/admin/`，确认面板显示，点击拉取按钮测试

### 第四步：本地端到端验证

1. `docker compose up -d --build`（自动合并 override）
2. 等待 MySQL 健康检查通过
3. `docker compose exec backend python manage.py migrate`
4. `docker compose exec backend python manage.py init_admin`
5. 访问 `http://localhost:8888`：确认前端加载
6. 访问 `http://localhost:8000/admin`：确认后台 + 系统环境面板
7. 点击"拉取服务器数据库"：确认数据同步成功
8. 验证本地数据与服务器一致

### 第五步：生产不变性验证

1. `git push origin main`
2. SSH 到服务器，执行 `./update.sh`
3. 确认服务器 `docker compose up -d --build` 正常（无 override 文件，跑纯生产配置）
4. 确认 `DEPLOY_ENV` 未设置 -> 后台显示"服务器生产"，同步功能不显示
5. 确认生产数据未受任何影响

---

## 十一、验证清单

### 本地验证

- [ ] `docker compose up -d --build` 全部服务启动正常
- [ ] `http://localhost:8888` 前端页面加载
- [ ] `http://localhost:8000/admin` 后台可登录
- [ ] 后台首页显示"系统环境"面板
- [ ] 面板显示"当前环境: 本地开发"
- [ ] "拉取服务器数据库"按钮可见且可点击
- [ ] 点击拉取后，同步状态从"同步中"变为"同步成功"
- [ ] 本地数据库数据与服务器一致
- [ ] `data/media/` 文件与服务器一致
- [ ] `data/snapshots/` 文件与服务器一致
- [ ] 等待 1 小时，确认自动同步触发
- [ ] 本地可正常创建/保存数据（可写）
- [ ] git push 后服务器 `update.sh` 正常运行

### 生产验证

- [ ] `git pull` 后 `docker compose up` 仅启动生产服务（无 db-sync 容器）
- [ ] 后台显示"当前环境: 服务器生产"
- [ ] "拉取服务器数据库"按钮不显示
- [ ] 生产数据未受任何影响
- [ ] 生产 MySQL 未启用 binlog、未开复制账号

---

## 十二、前提条件

### 本机需准备

- Docker Desktop 已安装并运行
- SSH 密钥已配置可免密登录服务器 `10.0.0.6`（`ssh root@10.0.0.6` 可直接连）
- 知道服务器生产 MySQL 密码（当前为 `IqAir@2026Riven!`，见 `update.sh`）
- 知道服务器上项目部署的绝对路径（供 `sync-db.sh` 远程 `docker compose -f <path>` 定位）

### 服务器无需任何改动

只需确认服务器上 `docker compose ps mysql` 能看到 MySQL 容器正常运行。

---

## 十三、已确认信息（实施前对齐完成）

1. **服务器项目绝对路径**：`/opt/iqair-workbench/`（`update.sh` 位于 `/opt/iqair-workbench/update.sh`，`docker-compose.yml` 位于 `/opt/iqair-workbench/docker-compose.yml`）。`sync-db.sh` 的远程命令使用 `docker compose -f /opt/iqair-workbench/docker-compose.yml` 定位
2. **SSH 用户**：`root`，可直接登录服务器 `10.0.0.6`，具备 docker 执行权限。SSH 认证方式用密码（密码仅存在本地 `.env` / `docker-compose.override.yml`，不入 git），实施第一步配置 `sshpass` 以便脚本自动使用密码，或后续可改用 `ssh-copy-id` 免密
3. **`.env.example` 入库**：保留入库。`.env.example` 和 `.env.prod.example` 仅含占位值（`rootpassword123` / `change_this_to_strong_password`），不是真实密钥；真实 `.env`（含生产 DB 密码 `IqAir@2026Riven!`、SSH 密码）保持被 gitignore 忽略，不进 git
4. **同步容器资源**：每小时 dump + rsync 的 IO 负担可接受

### 密钥管理（安全红线）

以下敏感值**只允许**出现在本地不入库文件（`.env`、`docker-compose.override.yml`），**绝不**写入任何入库文件：

- 服务器 SSH 密码
- 服务器生产 MySQL 密码（`IqAir@2026Riven!`，见 `update.sh` 第 38 行硬编码）
- 本地 MySQL / Redis 密码

实现上：同步容器通过 `docker-compose.override.yml` 注入环境变量（已被 gitignore），同步脚本从环境变量读取，不在源码中出现任何明文密码。

### 密码一致性提示

`update.sh` 中硬编码的服务器 DB 密码为 `IqAir@2026Riven!`，与本地 `.env` 中的 `iqairpassword123` 不同。这是预期的：本地是独立可写库，用自己的密码；同步时 dump 用服务器密码 `IqAir@2026Riven!`，导入用本地密码 `iqairpassword123`。两端密码不需要一致。

### 远程 mysqldump 路径修正

`sync-db.sh` 的远程命令应改为绝对路径定位 docker-compose：

```bash
ssh "${SERVER_USER}@${SERVER_HOST}" \
  "docker compose -f /opt/iqair-workbench/docker-compose.yml exec mysql \
   mysqldump -u iqair -p\"${SERVER_DB_PASS}\" --single-transaction --routines --triggers iqair_workbench"
```

media / snapshots 的远程 rsync 路径同样使用 `/opt/iqair-workbench/data/` 前缀。

---

---

## 十四、环境自适应底层逻辑（零干预运行）

### 14.1 设计目标

**零干预运行**：项目代码自动识别当前运行环境，全程无需手动设置 DEPLOY_ENV。

**安全默认**：所有自动检测信号均无法确定时，默认回退到 production。

### 14.2 检测信号链（优先级从高到低）

| 优先级 | 信号 | 机制 | 命中时返回 |
|--------|------|------|------------|
| 1 | DEPLOY_ENV 环境变量 | 显式覆盖，通过 override.yml 注入 | 按值返回 |
| 2 | iqair-db-sync DNS 解析 | 仅本地 override 定义，Docker DNS 可解析 | local |
| 3 | 安全回退 | 所有信号均未命中 | production |

### 14.3 核心实现

后端检测工具：backend/utils/env_detect.py

```python
def detect_deploy_env():
    env = os.environ.get("DEPLOY_ENV", "").strip().lower()
    if env in ("local", "production"):
        return env
    try:
        socket.getaddrinfo("iqair-db-sync", None, socket.AF_INET, socket.SOCK_STREAM)
        return "local"
    except (socket.gaierror, OSError):
        pass
    return "production"
```

辅助函数：is_local()、is_production()、get_env_info()。

Django settings 集成：
```python
from utils.env_detect import detect_deploy_env
DEPLOY_ENV = detect_deploy_env()
SYNC_ENABLED = DEPLOY_ENV == 'local' and ...
```

### 14.4 后续代码原则

1. 禁止硬编码环境判断，统一使用 env_detect 模块
2. 环境差异通过 env var 注入，不得硬编码
3. 入库文件保持环境无关
4. 本地差异只在 override（被 gitignore）
5. 默认行为必须是生产安全

---

## 十五、环境切换高危操作清单

### P0 致命

1. 修改 docker-compose.yml 端口/网络：改后必须检查 nginx/iqair.conf、vite.config.ts、update.sh 的端口

2. 修改 settings.py 数据库配置：保持 os.environ.get() 模式

3. 修改 .env 密码未同步 update.sh：改服务器密码必须同时改 update.sh 第 38 行

4. 删除 docker-compose.override.yml：本地热重载和同步容器依赖此文件

### P1 高危

5. 修改 vite.config.ts proxy：保持 env.VITE_API_BASE_URL || 'http://10.0.0.6:8000' 模式

6. 修改 Dockerfile：本地先 build 验证再 push

7. 修改 Celery beat_schedule.py：新任务内部用 is_production() 守卫

8. 未同步的数据库迁移：迁移文件提交到 git -> push -> update.sh 自动运行

### P2 中危

9. 修改 .gitignore：用 git status --ignored 和 git ls-files 验证

10. 修改 settings.py CSRF/CORS：确认列表包含生产和本地域名

11. 新增依赖未更新 requirements.txt：push 后确认生产 build 成功

12. 修改 nginx/iqair.conf：先在生产 nginx -t 验证语法

---

## 十六、环境切换检查流程

本地推送前：
1. git status 和 git diff 确认只有应入库文件
2. 确认迁移文件已包含
3. docker compose up -d --build 本地启动成功
4. 访问 localhost:8888 和 /admin 确认正常

服务器 update.sh 后：
1. docker compose ps 所有服务 Up
2. 日志无 ERROR
3. 确认后台显示"服务器生产"而非"本地"

同步异常时：
1. docker compose exec backend python -c "from utils.env_detect import get_env_info; print(get_env_info())"
2. docker compose logs db-sync
3. 确认 SSH 连接和密码

---
