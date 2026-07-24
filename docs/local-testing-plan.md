# IQAir Workbench 本地测试计划

# IQAir Workbench 本地测试计划

## 概述
本文档提供在本地测试IQAir Workbench项目的详细指南，通过localhost:8888访问前端界面。

## 项目架构
- **前端**: Vue 3 + Vite (端口8888)
- **后端**: Django 5 + DRF (端口8000)
- **数据库**: MySQL 8.0
- **缓存/消息队列**: Redis 7
- **后台任务**: Celery

## 方案选择

### 方案一：Docker部署（推荐）
**优点**：
- 一键启动所有服务
- 环境隔离，无需担心依赖冲突
- 与生产环境一致

**缺点**：
- 需要安装Docker和Docker Compose
- 占用较多系统资源

### 方案二：本地安装部署
**优点**：
- 更轻量，资源占用少
- 更灵活的调试和开发

**缺点**：
- 需要手动安装所有依赖
- 可能遇到环境兼容性问题
- 需要配置虚拟环境

## 详细步骤

### 方案一：Docker部署

#### 1. 安装Docker
1. 下载并安装Docker Desktop: https://www.docker.com/products/docker-desktop/
2. 启动Docker Desktop

#### 2. 配置环境变量
`ash
# 复制环境变量模板
cp .env.example .env

# 编辑.env文件，设置必要的密码
# 至少修改以下变量：
# MYSQL_ROOT_PASSWORD=your_password
# MYSQL_PASSWORD=your_password
# REDIS_PASSWORD=your_password
# DJANGO_SECRET_KEY=your-secret-key
`

#### 3. 启动服务
`ash
# 构建并启动所有服务
docker compose up -d --build

# 查看日志
docker compose logs -f

# 等待服务启动完成
# 访问 http://localhost:8888
`

#### 4. 初始化数据库
`ash
# 运行数据库迁移
docker compose exec backend python manage.py migrate

# 创建超级用户
docker compose exec backend python manage.py createsuperuser
`

### 方案二：本地安装部署

#### 1. 环境准备

##### Python虚拟环境（重要！）
**什么是虚拟环境？**
- 虚拟环境是一个独立的Python环境，包含特定版本的Python和项目所需的包
- 避免不同项目之间的依赖冲突
- 保持系统Python环境的干净

**如何创建虚拟环境？**
`ash
# 进入后端目录
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境（Windows）
venv\Scripts\activate

# 激活虚拟环境（Mac/Linux）
source venv/bin/activate
`

##### 安装Python依赖
`ash
# 确保在激活的虚拟环境中
pip install -r requirements.txt
`

##### 安装Node.js依赖
`ash
# 进入前端目录
cd ../frontend

# 安装依赖
npm install
`

#### 2. 数据库配置

##### 安装MySQL
1. 下载并安装MySQL: https://dev.mysql.com/downloads/mysql/
2. 启动MySQL服务
3. 创建数据库和用户：
`sql
CREATE DATABASE iqair_workbench CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'iqair'@'localhost' IDENTIFIED BY 'iqairpassword123';
GRANT ALL PRIVILEGES ON iqair_workbench.* TO 'iqair'@'localhost';
FLUSH PRIVILEGES;
`

##### 安装Redis
1. 下载并安装Redis: https://redis.io/download
2. 启动Redis服务

#### 3. 环境变量配置
在ackend目录下创建.env文件：
`env
# 数据库配置
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=iqair_workbench
DATABASE_USER=iqair
DATABASE_PASSWORD=iqairpassword123

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redispassword123

# Django配置
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=*
`

#### 4. 启动后端服务
`ash
# 在backend目录下，确保虚拟环境已激活
cd backend

# 运行数据库迁移
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 启动Django开发服务器
python manage.py runserver 0.0.0.0:8000
`

#### 5. 启动前端服务
`ash
# 在frontend目录下
cd frontend

# 启动Vite开发服务器
npm run dev
`

#### 6. 访问应用
- 前端界面: http://localhost:8888
- Django管理后台: http://localhost:8000/admin
- API文档: http://localhost:8000/api/docs/

## 常见问题

### Q1: 为什么需要虚拟环境？
**A**: 虚拟环境可以：
1. 隔离项目依赖，避免版本冲突
2. 保持系统Python环境的干净
3. 方便项目部署和迁移
4. 不同项目可以使用不同版本的包

### Q2: Docker和本地安装哪个更好？
**A**: 
- **Docker**: 适合快速启动、团队协作、生产环境模拟
- **本地安装**: 适合深入开发、调试、资源有限的情况

### Q3: 遇到端口冲突怎么办？
**A**: 
- 检查端口是否被占用：
etstat -ano | findstr :8888
- 修改配置文件中的端口号
- 关闭占用端口的程序

### Q4: 数据库连接失败？
**A**: 
1. 确保MySQL服务正在运行
2. 检查数据库用户名和密码
3. 确保数据库已创建
4. 检查防火墙设置

### Q5: Redis连接失败？
**A**: 
1. 确保Redis服务正在运行
2. 检查Redis密码配置
3. 检查端口是否被占用

## 验证步骤

### 功能验证清单
1. [ ] 访问 http://localhost:8888 能看到登录页面
2. [ ] 使用创建的超级用户能登录
3. [ ] 能访问Django管理后台
4. [ ] API接口能正常响应
5. [ ] 前端页面无JavaScript错误

### 性能检查
1. 页面加载时间 < 3秒
2. API响应时间 < 1秒
3. 无内存泄漏警告

## 开发建议

### 推荐的工作流程
1. 使用Docker进行快速启动和测试
2. 需要深入调试时使用本地安装
3. 保持虚拟环境的干净
4. 定期更新依赖包

### 调试技巧
1. 查看Docker日志: docker compose logs -f backend
2. 查看前端控制台错误
3. 使用Django调试工具栏
4. 检查网络请求

## 总结
- **推荐新手使用Docker方案**：简单快捷，一键启动
- **推荐开发者使用本地安装方案**：更灵活，便于调试
- 无论选择哪种方案，都要确保环境配置正确
- 遇到问题时，先检查服务状态和配置文件

