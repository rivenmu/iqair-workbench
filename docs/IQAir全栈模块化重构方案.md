# IQAir Workbench 全栈模块化重构方案

## 概述

本次重构覆盖前端（Vue 3+Element Plus）、后端（Django 5+DRF+Celery）、数据库（MySQL 8.0）三个层面
以最小最精简、性能最优为原则，让项目各部分高度模块化、易于扩展和增加功能。
所有现有业务逻辑、数据流和对外 API 契约保持不动。

### 核心设计原则
- 精简优先：每行代码、每个组件、每个数据库字段必须有其存在的明确理由。优先删除冗余而非增加抽象
- 性能优先：避免不必要的渲染、查询和网络请求。前端一次加载全部就绪后再展现，不做先显示缓存再刷新的体验
- 空间利用：充分利用页面可用空间，表格/图表撑满视口，无浪费的留白区域，同时确保可读性和美观性
---

## 第一部分：前端重构

### 1. 设计 Token 与基础修复

现状问题：tokens.scss 中 4 个 mixin 各自包含重复的 CSS 变量声明。Login/Register 中背景光斑动画重复。多个视图各自定义相同 keyframes。存在先渲染缓存再刷新数据的闪烁问题。

- 修复 tokens.scss：移除 mixin 内重复 CSS 变量块。添加暗色模式 Token 骨架
- 新建 styles/animations.scss：集中管理所有 keyframes 和过渡工具类
- 新建 styles/echarts-theme.ts：集中定义 ECharts 调色板和默认配置
- global.scss 只保留 reset 和基础脚手架

### 2. 数据加载策略：准备好后一起展现

现状问题：部分页面先渲染占位/缓存内容，API 返回后替换，造成视觉闪烁。

- 全局 LoadingGuard：在 router 守卫中，对于需要数据的路由，await 数据加载完成后再放行导航。页面对用户可见时数据已就绪
- 组件级 Suspense：对异步组件使用 Vue 3 Suspense + 骨架屏 fallback，数据未就绪时展示骨架而非空白/缓存
- 首屏关键路径：Navigation 页面为入口，分类数据和收藏数据并行加载，使用 Promise.all 后一次性渲染
- 仪表盘页面：图表数据通过路由守卫预加载，进入页面时 ECharts 直接渲染，无二次刷新
### 3. 页面空间最大化利用

现状问题：部分视图 padding 过大、卡片有固定 max-height、图表区域未撑满可用空间。

- AppSidebar 宽度从 320px 精简到 260px（信息密度不变，间距收紧）
- 仪表盘主区域：移除 max-height: 900px 限制，使用 height: 100% + flex: 1 撑满视口
- IQAirDataPanel：两个平台模块从固定 min-height: 380px 改为等分可用高度（flex: 1），图表区域弹性伸缩
- 统计卡片网格：从 repeat(4, 1fr) 改为 auto-fill 自适应，小屏自动折行
- 可读性保障：表格行高 >=40px，字号 >=12px，对比度符合 WCAG AA

### 4. 共享组件库

| 组件 | 用途 | 消除的重复 |
|------|------|------------|
| AppNavBar.vue | 统一顶部导航栏 | 两个Layout约120行重复 |
| UserMenu.vue | 头像+用户名+下拉菜单 | 两个Layout用户菜单重复 |
| BlobBackground.vue | 浮动渐变光斑背景 | Login+Register各约60行重复 |
| AppSidebar.vue | 左侧面板260px带具名插槽 | 三个仪表盘视图侧边栏 |
| StatCard.vue | 汇总统计卡片 | IQAirDataPanel两处汇总卡片 |
| EmptyState.vue | 图标+描述占位 | Navigation和5个占位面板 |
| ContentCard.vue | 毛玻璃卡片容器 | 所有仪表盘卡片容器 |
| PageHeader.vue | 统一页面标题+操作插槽 | Profile+UserManagement |
| LoadingSkeleton.vue | 骨架屏加载态 | 所有数据加载场景 |

### 5. 布局统一
- MainLayout.vue 重构为组合 AppNavBar + UserMenu
- WorkbenchLayout.vue 重构为组合 AppNavBar + UserMenu + Tab栏
- App.vue 添加 transition name=page-fade mode=out-in 统一页面过渡

### 6. 视图优化
- Login/Register：BlobBackground，硬编码颜色->Token，卡片不设固定高度
- Navigation.vue：侧边栏优化过渡，卡片动画集中化，链接卡片填充可用宽度
- IQAirCompetitor.vue：AppSidebar、ContentCard、ECharts主题，图表+表格填充主区域
- IQAirDataPanel.vue：AppSidebar、StatCard、ECharts主题、骨架屏，两模块等分高度
- IQAirDashboard.vue：AppSidebar、ContentCard、ECharts主题
- Profile/UserManagement：PageHeader、统一Token
- 占位面板：EmptyState组件+Token样式

### 7. 动效
- 卡片悬停抬升+shadow增强
- 按钮按下scale(0.96)
- Tab指示器滑动下划线
- 侧边栏指示条过渡
- 路由fade过渡（150ms，快速不拖沓）

### 8. 清理
- 删除所有 .vue.js 构建产物
- 删除 Navigation.vue.backup
- 删除跨视图重复的 @keyframes
- 删除未使用的 CSS（手动审计）

## 第二部分：后端重构

### 1. 配置拆分

现状：settings.py单文件206行，SECRET_KEY有硬编码降级值
- 拆为config/settings/base.py、dev.py、prod.py
- SECRET_KEY生产模式禁止降级，缺失抛ImproperlyConfigured
- 使用python-dotenv统一环境变量管理

### 2. 公共基础Model
- 新建utils/models.py提供：
  - TimestampModel：created_at/updated_at（所有模型统一继承）
  - SoftDeleteModel：is_deleted/deleted_at（软删除场景）
  - AuditableModel：预置审计钩子，配合AuditLogMixin自动记录

### 3. API版本化
- 添加/api/v1/前缀，旧路由保留3个月兼容期
- 新结构：/api/v1/auth/、/api/v1/dashboard/、/api/v1/navigation/、/api/v1/snapshots/、/api/v1/audit/、/api/v1/projects/

### 4. 性能优化

查询优化：
- select_related/prefetch_related 审计
- 批量操作使用 bulk_create
- 分页默认 page_size=50

缓存策略：
- SystemEnv Redis 缓存 TTL 5分钟
- 导航链接 Redis 缓存 TTL 10分钟
- 平台数据汇总缓存 TTL 30秒

响应精简：
- 序列化器字段审计
- records 超100条时分页

### 5. Service层规范化
- 统一为apps/<app>/services.py模式
- 服务继承BaseService基类，提供日志和事务装饰器
- 所有写操作显式@transaction.atomic
- 引入BusinessError(code,message)自定义业务异常

### 6. 异常处理中间件
- utils/exceptions.py：BusinessError、ValidationError
- ExceptionHandlerMiddleware：统一返回格式

### 7. 权限体系模块化
- 移至utils/permissions.py：IsAdmin、IsOwnerOrAdmin、IsOwnerOrReadOnly

### 8. 序列化器拆分
- accounts/serializers/拆为auth.py和user.py
- __init__.py重导出保持向后兼容

### 9. 测试覆盖
- 每个app创建tests/目录，pytest+pytest-django
- 覆盖：auth、dashboard、navigation、snapshots
## 第三部分：数据库优化

### 1. 索引补充

| 表 | 索引 | 原因 |
| platform_sales_data | (platform,period_type,date) | 核心查询 |
| operation_logs | (user_id,timestamp) | 用户操作历史 |
| operation_logs | (module,timestamp) | 模块审计 |
| filter_revenues | (brand_id,period) | 仪表盘聚合 |
| website_links | (category,sort_order) | 导航分类排序 |

使用Meta.indexes统一声明。

### 2. 字段优化
- Brand.logo：超10KB base64自动落地为文件
- OperationLog JSONField：添加Schema注释文档化
- PlatformSalesData.period_label：改为@property动态计算

### 3. Django Admin 全面可管理

要求：每个功能模块的数据上传/修改/查看，都必须在 Django Admin 后台操作。

需要注册到 Admin 的模型：
- accounts.User：list_display含username/role/email/last_login_ip。search_fields: username,email。list_filter: role
- dashboard.Brand：list_display含name/project/color/sort_order。list_filter: project。支持内联编辑FilterRevenue
- dashboard.FilterRevenue：list_display含brand/period/revenue/filter_percentage。内联到Brand admin。支持CSV导出
- dashboard.UIText：list_display含project/key/value。list_filter: project
- dashboard.PlatformSalesData：list_display含platform/period_type/date/sales_amount。list_filter: platform/period_type。date_hierarchy: date。配置django-import-export支持Excel导入导出
- navigation.WebsiteLink：list_display含name/category/is_internal/is_active。list_filter: category/is_internal。search_fields: name/url
- navigation.UserFavorite：list_display含user/website_link/created_at
- projects.Project：list_display含name/is_active/sort_order
- snapshots.DataSnapshot：全部字段readonly。list_filter: project/operation_type
- audit.OperationLog：全部字段readonly。list_filter: action/module
- system_env.SystemEnv：list_display含key/value/env_type/is_active。list_filter: env_type/is_active

- 使用SimpleUI保持现有后台主题
- 大数据量表（PlatformSalesData、OperationLog）配置raw_id_fields
- PlatformSalesData配置django-import-export的ImportExportModelAdmin
### 4. Migration整理
- 每个app执行squashmigrations合并迁移
- 种子数据从migration移出为management command（seed_navigation）

### 5. 环境配置表扩展
- SystemEnv增加env_type、is_active字段
- SystemEnvService使用Redis缓存（TTL 5分钟）
- 将散落的环境配置统一到SystemEnv管理

## 第四部分：部署运维优化
- Docker多阶段构建减小镜像体积
- 前端生产构建改为nginx:alpine
- 后端添加/api/health/健康检查端点
- docker-compose.yml所有服务添加healthcheck
- 生产环境日志改为结构化JSON
## 第五部分：验证方案

### 前端
1. 遍历全部路由确认无视觉回归
2. 功能回归：登录/注册/Tab切换/Excel上传/数据编辑/快照/修改密码
3. 1920px/1400px/1024px/768px响应式检查
4. Token审计：搜索硬编码颜色值全部替换
5. 加载体验：各页面首次进入不出现缓存闪烁，数据准备好后统一展现
6. 空间利用：图表区域撑满视口，无边距浪费

### 后端
1. docker compose up -d --build全部服务启动
2. python manage.py check --deploy无警告
3. python manage.py migrate无错误
4. 新API路径返回正确数据
5. Django Admin各模型注册完整，可进行增删改查操作
6. API响应时间：核心查询 <200ms（本地环境）

### 数据库
1. sqlmigrate检查索引生成
2. Migration可回滚
3. seed_navigation可重复执行
## 第六部分：假设与前提
- 后端API契约和数据流不变，仅路径增加/v1前缀
- 不引入新第三方依赖（除pytest-django和django-import-export用于Admin）
- 数据库引擎版本不变（MySQL 8.0+utf8mb4）
- 暗色模式仅预置Token，不激活切换UI
- .vue.js为Vite缓存，删除后自动重新生成
- 旧API路径保留3个月兼容期

## 第七部分：多Agent并发实施计划

将工作拆分为5个独立可并发的Agent任务线：

### Agent-1：前端基础层
- 修复 tokens.scss，新建 animations.scss、echarts-theme.ts
- 实现 LoadingSkeleton.vue、EmptyState.vue、ContentCard.vue
- 添加 App.vue 页面过渡+路由 LoadingGuard（数据就绪后展现）

### Agent-2：前端组件与布局
- 实现 AppNavBar.vue、UserMenu.vue、BlobBackground.vue
- 实现 AppSidebar.vue（260px）、StatCard.vue、PageHeader.vue
- 重构 MainLayout.vue、WorkbenchLayout.vue

### Agent-3：前端视图接入
- 逐个视图接入新组件和 Token（Login/Register/Navigation/6个Dashboard面板/Profile/UserManagement）
- 空间利用优化：移除固定max-height，flex撑满，Sidebar精简
- 数据加载策略：Suspense+骨架屏，消除缓存闪烁

### Agent-4：后端重构
- 拆分 settings.py（base/dev/prod）
- 新建 utils/models.py（TimestampModel等）、utils/exceptions.py、utils/permissions.py
- API版本化路由、Service层规范化、异常处理中间件、序列化器拆分
- 性能优化：查询预加载审计、bulk_create、缓存策略、分页

### Agent-5：数据库与Admin
- 添加索引 migration、整理历史 migration、squashmigrations
- Django Admin 全面注册（10个模型），配置 list_display/list_filter/search_fields
- PlatformSalesData 配置 django-import-export
- SystemEnv 扩展 + Redis 缓存
- Docker 多阶段构建、健康检查、日志优化
### 集成阶段（所有Agent完成后）
- Agent-4 + Agent-5：后端+数据库联调，migrate + check --deploy
- Agent-1 + Agent-2 + Agent-3：前端组件集成，路由加载策略联调
- 全栈集成：前后端联调，全流程回归测试
- 清理 .vue.js、Token审计、Django Admin 功能验证
## 第八部分：架构决策记录（ADR）

以下为讨论确认的关键决策：

### ADR-1：数据加载策略
- 页级数据（Navigation分类、仪表盘品牌列表等）：路由守卫 beforeResolve 中 await store action，数据就绪后放行
- 组件级异步（ECharts图表渲染、懒加载面板）：Vue 3 defineAsyncComponent + Suspense，fallback 展示 LoadingSkeleton
- 路由过渡动画在数据就绪后才触发，确保用户看到的第一帧即为完整页面

### ADR-2：AppSidebar 宽度与折叠
- 默认宽度 260px（紧凑但不拥挤）
- 品牌管理区、图表标签编辑区默认折叠，点击展开（减少一次性操作按钮的常驻面积）
- 编辑模式按钮、快照按钮始终可见

### ADR-3：API 契约先行
- Agent-4 在开始编码前，先生成完整的 /api/v1/ 路由清单（含 method、path、request/response schema）
- 该清单作为 Agent-1/2/3 前端开发的共享约定，放入 docs/api-v1-routes.md

### ADR-4：Brand.logo 文件存储
- 将 Brand.logo 从 TextField(base64) 迁移为 ImageField，存储到 media/brand_logos/
- 现有 base64 数据通过 data migration 批量转换为文件
- Django Admin 中展示缩略图预览

### ADR-5：Redis 缓存命名规范
- Key 前缀统一为 iqair:，格式：iqair:{module}:{resource}:{identifier}
- 示例：iqair:nav:links:work_sites、iqair:dashboard:summary:tmall:daily
- 缓存数据库：db 3（与 Celery broker db 0、Django cache db 1、Channels db 2 隔离）
- 写操作后通过 django.db.models.signals.post_save/post_delete 自动失效对应缓存键
### ADR-6：清理范围
- 删除所有 .vue.js 构建产物
- 删除 Navigation.vue.backup
- 删除与 .ts 文件同名的 .js 编译产物（api/auth.js、stores/user.js 等，共约12个文件）
- 删除跨视图重复的 @keyframes 声明
- 删除未使用的 CSS（手动审计）

### ADR-7：依赖策略
- 允许新增：pytest-django（测试）、django-import-export（Admin Excel 导入导出）
- 禁止新增：大型框架、替代现有 Element Plus/ECharts 的库
- 现有依赖保持版本不变

### ADR-8：抽象层级
- 新增抽象以模块化和可扩展性为优先目标
- TimestampModel：所有模型统一继承，消除重复的 created_at/updated_at 定义
- BaseService：提供统一的 logger 和 transaction 装饰器
- BusinessError：替代散落的 ValueError，支持错误码和结构化响应
- SoftDeleteModel/AuditableModel：按需继承，非强制
---

## 第九部分：首页重构（网址收藏与展示页）

### 概述

完全替换现有 Navigation.vue，打造一个无需登录即可浏览、登录后可收藏的网址导航首页。顶部展示三个项目子站大色块，下部展示分类网址收藏。DataEase（BI看板）与本项目共享 MySQL 用户表实现登录状态互通。

### 页面布局

顶部区域（Hero Section）：
- 三个大色块横向排列，分别链接到：
  - IQAir竞品分析站（紫色渐变） -> /dashboard/iqair-competitor
  - IQAir数据BI工作台（蓝色渐变） -> DataEase BI 外链
  - IQAir实用小工具（橙色渐变） -> /ciyun（词云分析页）
- 色块尺寸：桌面端约 340px 宽 x 240px 高，内嵌项目图标、名称和简介
- 色块悬停抬升 + 光效，点击跳转
- 色块数据来源于 Project 模型（is_featured=True），管理员可在前端和 Django Admin 新增/编辑

下部区域（网址收藏区）：
- Tab 切换栏，默认三个标签：常用网址、友情链接、AI工具资料
- Tab 标签由管理员在前端和 Django Admin 新增/编辑（对应 WebsiteLink.category 扩展）
- 每个 Tab 下以卡片网格展示网址链接
- 卡片包含：网站图标（自动抓取 favicon）、名称、简介、域名
- 图标自动抓取策略：后端异步抓取目标网站 favicon -> 成功则存储到 media/link_icons/ -> 失败则前端用名称首字母生成圆形头像
- 已登录用户可点击红心收藏，未登录用户点击红心提示登录但不跳转

### 访问权限策略

- 整个首页无需登录即可浏览（路由 meta: requiresAuth: false）
- API 请求不携带 token 时，后端返回公开数据（色块列表 + 分类链接），不返回用户收藏状态
- 已登录用户额外获取收藏状态（is_favorited 字段），非登录用户该字段恒为 false
- 右上角显示登录按钮（未登录）/ 用户头像下拉菜单（已登录）
- 不弹出强制登录提示，不自动跳转 /login
- JWT 过期时不弹错误 toast，静默清除本地 token，回退到未登录状态
### DataEase（BI看板）登录互通

现状：DataEase 已有独立部署，与本项目 BI 看板为同一服务。当前 WorkbenchLayout 中通过外链 /bi/ 访问。

目标：两个系统共享 MySQL users 表，用户在本项目登录后，访问 DataEase 无需二次登录。

技术方案：
1. 确保 DataEase 的数据库连接配置（application.yml 或环境变量）指向与 Django 相同的 MySQL 实例
2. DataEase 默认使用其内置的 de_user 表，需修改其认证数据源指向本项目 users 表：
   - 方案：配置 DataEase 的 LDAP/OIDC 插件，或直接修改其 Spring Security 配置指向 users 表
   - 密码加密需兼容：Django 使用 PBKDF2-SHA256，DataEase 默认 BCrypt。需要创建 Django 侧兼容登录中间件，在登录时同时写入 BCrypt 哈希到 DataEase 可读的字段
3. 在 Django User 模型中增加 dataease_password 字段（存储 BCrypt 哈希），login 时同步更新
4. 前端登录表单增加一个隐藏的同步请求，调用 DataEase 的 /api/auth/login 或直接写入共用 token

注意：此部分为跨系统集成，具体实施需确认 DataEase 版本和认证架构后微调。先以调研和 POC 为目标。

### 后端模型变更

Project 模型增强：
- 增加 is_featured (BooleanField)：标记是否在首页色块区展示
- 增加 gradient_color (CharField)：色块渐变色 CSS 值（如 linear-gradient(135deg, #4F46E5, #7C3AED)）
- 增加 subtitle (CharField)：色块内副标题/简介
- 增加 icon_type (CharField)：图标类型（image/emoji/icon_name）

WebsiteLink 模型：
- 现有 category 的 choices 扩展为：常用网址(common_sites)、友情链接(friend_links)、AI工具资料(ai_resources)
- 保留原有 work_sites/personal_sites/tools/ai_tools 不变（兼容期），新增三个分类
- admin 中 category list_filter 同步更新

User 模型：
- 增加 dataease_password (CharField, nullable)：存储 BCrypt 格式密码哈希，与 DataEase 共享

### 图标自动抓取

后端：
- 在 navigation.views 或 celery task 中实现 favicon 抓取：GET 目标网站 -> 解析 HTML 提取 <link rel=icon> -> 下载图标 -> 保存到 media/link_icons/{link_id}.ico
- 抓取成功：设置 WebsiteLink.icon_image 为文件路径
- 抓取失败：WebsiteLink.icon_image 保持 null，标记 icon_fetch_failed=True 避免重复抓取
- 管理员可在 Django Admin 手动触发重新抓取（action 按钮）

前端：
- 卡片渲染时，icon_image 有值则展示图片
- icon_image 为 null 时，取网站名称首字符生成彩色圆形头像（背景色基于名称哈希，确保同名称颜色一致）
- 头像组件独立为 LetterAvatar.vue，接收 name 和 size 两个 props
### 首页的前端编辑能力（管理员）

- 管理员登录后，色块区域出现编辑按钮（笔图标），点击弹出编辑弹窗
- 可编辑色块：名称、副标题、链接地址、渐变色、图标
- Tab 标签旁出现「+」添加按钮和齿轮设置按钮
- 每个链接卡片出现编辑/删除按钮（仅管理员可见）
- 新增链接时自动触发 favicon 抓取
- 所有色块、标签、链接的新增/编辑同步可写入 Django Admin（数据同源）

### Django Admin 对应管理

- Project Admin：增加 is_featured、gradient_color、subtitle 字段到 list_display 和 fieldsets
- 可直观管理首页展示的三个色块（勾选 is_featured 即可展示）
- WebsiteLink Admin：category 新增分类后自动出现在首页 Tab
- 管理员可在 Admin 中直接上传/替换图标、修改排序

### 与现有 Navigation.vue 的迁移

- 现有 Navigation.vue 完全替换为新的 HomePage.vue
- 现有分类（work_sites/personal_sites/tools/ai_tools）保留但不再在首页展示，通过 /dashboard 中的项目 Tab 可访问
- 现有收藏数据（UserFavorite）保持不变，首页红心收藏继续使用同一张表
- 现有链接数据（WebsiteLink）中属于新分类的条目直接在首页展示，旧分类条目可通过 Django Admin 批量迁移分类

### ADR-9：DataEase 认证互通
- DataEase 与 Django 共享同一 MySQL 实例的 users 表
- User 模型增加 dataease_password 字段存储 BCrypt 哈希
- Django 登录时同步更新 dataease_password，供 DataEase 验证使用
- 具体 DataEase 端配置需根据其版本确定认证适配方案

### ADR-10：首页访问控制
- 整个首页 public，不要求登录
- API 层根据请求是否带有效 JWT 返回不同数据（收藏状态字段）
- JWT 过期静默处理，不弹错误提示，不强制跳转
- axios 拦截器针对 /api/v1/navigation/links 路径不触发 401 跳转
### Agent-6：首页重构
- 实现 LetterAvatar.vue（首字母头像组件）
- 实现 HomePage.vue（完全替换 Navigation.vue）
- 三大色块（Hero Section）：渐变色背景、悬停动效、编辑弹窗
- 分类 Tab 栏 + 网址卡片网格（含自动抓取图标逻辑）
- 红心收藏（已登录可用，未登录不弹窗）
- 响应式适配（移动端色块纵向排列）
- JWT 过期静默处理：修改 axios 拦截器，/navigation 路径不触发 401 跳转和错误 toast

### Agent-6 后端配合
- Project 模型增加 is_featured/gradient_color/subtitle/icon_type 字段（migration）
- WebsiteLink.category choices 扩展新分类
- User 模型增加 dataease_password 字段
- favicon 自动抓取 Celery task + Django Admin action
- Project Admin + WebsiteLink Admin 字段更新
- API 层公开/登录态双模式返回

### Agent-7：DataEase 认证集成
- 调研 DataEase 当前版本认证架构（Spring Security 配置）
- 实现 DataEase 连接本项目 MySQL users 表的配置
- Django 侧 login 时同步更新 dataease_password（BCrypt 哈希）
- 端到端验证：Django 登录 -> 访问 DataEase -> 已认证状态

### 更新后的 Agent 依赖关系
- Agent-1/2（前端基础层/组件布局）-> 无依赖，可最先启动
- Agent-4（后端重构）-> 无依赖，可最先启动
- Agent-5（数据库 Admin）-> 依赖 Agent-4 的模型变更完成后进行
- Agent-6（首页重构）-> 依赖 Agent-1/2 的组件 + Agent-4 的 API 路由表
- Agent-3（视图接入）-> 依赖 Agent-2 组件 + Agent-4 API 表 + Agent-6 首页架构确定
- Agent-7（DataEase）-> 可与 Agent-4 并行，但需要 Agent-4 的 User 模型变更
---

## 第十部分：补充建议（已确认纳入）

### 1. Dashboard 保存原子性保障

现状问题：DashboardService.save_dashboard_data 先 DELETE 全部数据再逐条 INSERT。若中途失败，数据库处于空状态。

改造方案：
- 改为 upsert 模式：解析新数据 -> 对比现有数据 -> 仅更新/新增/删除差异部分
- Brand 更新使用 update_or_create（按 project+name）；FilterRevenue 同理（按 brand+period）
- 删除：旧数据中存在但新数据中没有的条目，在事务末尾统一清理
- 全程在 @transaction.atomic 内，失败自动回滚
- 快照创建时机不变（在开始变更前先保存旧数据快照）

### 2. 前端数据一致性策略

现状问题：IQAirCompetitor 以 localStorage 优先，后端备份。多管理员同时编辑会发生静默覆盖。

改造方案：
- 改为后端为唯一权威数据源，前端 localStorage 仅作为离线草稿缓存
- 加载时：API 返回最新数据，前端展示。同时写入 localStorage 作为缓存（离线恢复用）
- 保存时：直接 POST 到后端。后端返回最新数据（含 updated_at），前端更新视图和 localStorage
- 冲突检测：保存请求中附带 loaded_at 时间戳。后端对比记录的 updated_at，若记录已被他人修改则返回 409 Conflict
- 前端收到 409 后提示用户刷新获取最新版本

### 3. 快照文件安全

现状问题：>1MB 快照明文存储在 data/snapshots/，服务器文件系统访问即可读取。

改造方案：
- 存储时使用 Django SECRET_KEY 派生的 AES-256 密钥加密
- 加密逻辑封装在 SnapshotService 中（encrypt_snapshot/decrypt_snapshot）
- 密钥派生：使用 HKDF 从 SECRET_KEY 派生独立密钥，避免直接暴露主密钥
- 加密存储的 snapshot 文件名加 .enc 后缀以示区分
- 解密仅在 restore 时进行，日志不输出明文

### 4. 开发环境初始化

创建 .env.example 模板文件，列出所有环境变量和中文注释。创建 scripts/setup.sh 实现一键初始化：检查 Docker、复制 .env、生成密钥、创建目录、启动服务、执行 migrate+init_admin+seed_navigation。AGENTS.md 更新 setup 步骤。

### 5. API 交互文档

drf-spectacular 已安装但未启用。在 config/urls.py 添加 Swagger UI 和 Redoc 端点。为 ViewSet 添加 @extend_schema 装饰器完善参数描述。作为 Agent 间共享的接口契约文档。

### 6. 词云数据后端化

新建 CloudWord 模型（cn_text/en_text/weight/is_active）。注册到 Django Admin。新增 GET /api/v1/dashboard/cloud-words/ API。前端面板新增关键词编辑区。与三大色块之一的实用小工具形成完整闭环。

### 7. 应用级监控

/api/health/ 端点返回结构化 JSON 含 database 连接状态、redis 状态、celery_workers 活跃数、uptime 秒数。可选集成 Sentry SDK 做错误追踪（免费 tier）。Django LOGGING 生产环境改为 JSON 格式，增加 request_id 追踪字段。

### 8. 表格编辑改为 Vue 数据绑定

IQAirCompetitor 当前使用 contenteditable=true 直接操作 DOM，改为标准 Vue v-model 双向绑定：每个可编辑单元格用 <input> 替代 contenteditable div，数据变化直接反映到响应式 brand 对象，保存时统一提交。消除 DOM 操作带来的不一致性和维护负担。
### ADR-11：Dashboard 保存原子性
- save_dashboard_data 改为 upsert 模式，不再 DELETE+INSERT
- 对比差异后仅更新变更部分，事务保护

### ADR-12：数据权威源
- 后端为唯一权威数据源，localStorage 降级为离线草稿缓存
- 保存请求附带 loaded_at 时间戳，冲突返回 409

### ADR-13：快照加密
- >1MB 快照文件使用 AES-256 加密存储
- 密钥由 SECRET_KEY 通过 HKDF 派生

### ADR-14：.env.example + setup 脚本
### ADR-15：drf-spectacular Swagger 文档
### ADR-16：词云数据后端化（CloudWord 模型）
### ADR-17：Sentry + health 监控端点
### ADR-18：表格编辑 v-model 替代 contenteditable
### 更新后的 Agent 任务分配（含补充项）

Agent-1（前端基础层）：+ v-model 替代 contenteditable 的辅助组件
Agent-2（组件与布局）：不变
Agent-3（视图接入）：不变

Agent-4（后端重构）：
  + DashboardService upsert 原子化
  + 冲突检测（409 Conflict）
  + CloudWord 模型 + API
  + drf-spectacular Swagger 端点
  + /api/health/ 监控端点

Agent-5（数据库与Admin）：
  + CloudWord 注册到 Admin
  + Sentry SDK 集成
  + 生产日志 JSON 化 + request_id

Agent-6（首页重构）：不变
Agent-7（DataEase集成）：不变

Agent-8（运维与安全）：
  + .env.example + scripts/setup.sh + scripts/setup.ps1
  + 快照文件 AES-256 加密
  + AGENTS.md 更新
  + Sentry 配置（若 Agent-5 未覆盖）