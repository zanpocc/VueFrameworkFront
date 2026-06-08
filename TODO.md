# VueFrameworkFront TODO

前端目标：Vue 3 + TypeScript + Vite + Yarn 企业后台平台，支持真实登录、动态菜单、按钮权限、系统管理、异步任务、工作流表单和完整自动化测试。

## 0. 长任务规则

- 包管理统一使用 Yarn，不引入 npm lockfile 或 pnpm lockfile。
- 页面优先复用 Element Plus 和项目内通用组件。
- 权限隐藏只负责用户体验，安全边界必须由后端接口校验。
- 新页面必须考虑 loading、empty、error、权限不足、接口失败状态。
- 新接口必须尽量使用 OpenAPI 生成类型，生成链路未完成前使用集中维护的 TypeScript 类型。
- 每轮功能交付后至少运行受影响的 lint、unit、E2E 或 build 命令。

## 1. 工程基线

- [x] Vue 3 + Vite
- [x] TypeScript
- [x] Yarn
- [x] Element Plus
- [x] Pinia
- [x] Vue Router
- [x] Axios
- [x] ESLint
- [x] Vitest
- [x] Playwright
- [x] `yarn lint`
- [x] `yarn test:unit`
- [x] `yarn test:e2e`
- [x] `yarn test:e2e:live:monolith-vm`
- [x] `yarn build`
- [x] Prettier
- [x] Stylelint
- [x] 环境变量模板：`.env.example`
- [x] API base url 配置：`VITE_API_BASE_URL`
- [x] Vite API 代理目标配置：`VITE_API_PROXY_TARGET`
- [x] 单体/网关联调环境模板：`.env.monolith.example`、`.env.cloud.example`
- [x] OpenAPI TypeScript client 生成
- [x] CI 模板
- [x] Dockerfile
- [x] Nginx 部署模板

长期命令：

```powershell
yarn lint
yarn lint:style
yarn format:check
yarn typecheck
yarn test:unit
yarn test:e2e
yarn build
```

## 2. 应用壳和交互基线

目标：建立可长期扩展的后台框架。

- [x] 登录页占位
- [x] 主布局
- [x] 工作台
- [x] 权限指令
- [x] 顶部用户菜单
- [x] 退出登录入口
- [ ] 面包屑
- [ ] 标签页导航
- [ ] 侧边栏折叠
- [ ] 菜单搜索
- [ ] 主题变量
- [ ] 全局 loading
- [ ] 全局错误页：403、404、500
- [ ] 列表页通用布局
- [ ] 查询表单通用布局
- [ ] 弹窗表单通用模式
- [ ] 删除确认和二次确认模式

验收：

- 刷新页面后登录态和菜单可恢复。
- 侧边栏和内容区在常见桌面宽度下不重叠。
- 权限不足、路由不存在、接口错误都有明确页面或提示。

## 3. 请求层

目标：统一接口调用、鉴权、错误处理和类型约束。

- [x] Axios 实例
- [x] `VITE_API_BASE_URL`
- [x] 开发代理 `/api -> VITE_API_PROXY_TARGET`
- [x] Token 注入
- [x] Refresh token
- [x] 401 处理：清理登录态并跳转登录页
- [x] 403 处理：统一权限不足提示
- [x] 5xx 处理：统一错误提示
- [ ] traceId/requestId 透传
- [x] 文件下载
- [x] 文件上传
- [ ] 统一分页响应类型
- [ ] 统一错误响应类型
- [x] API 类型生成

测试：

- [x] Token 注入单元测试
- [x] 401 处理单元测试
- [x] 403 处理单元测试
- [x] API client 类型生成验证

## 4. Auth 登录和权限闭环

目标：接入后端真实登录，形成用户、菜单、按钮权限闭环。

- [x] 登录接口接入：`POST /api/auth/login`
- [x] 当前用户接口接入：`GET /api/auth/me`
- [x] 当前菜单接口接入：`GET /api/auth/menus`
- [x] 当前权限接口接入：`GET /api/auth/permissions`
- [x] Token 持久化
- [x] 用户信息持久化
- [x] 权限信息持久化
- [x] 页面刷新后恢复登录态
- [x] 登录失败提示
- [x] 退出登录
- [x] 退出登录 API 接入：`POST /api/auth/logout`
- [x] 登录过期处理
- [x] 登录后重定向到原目标页面
- [x] 动态菜单生成动态路由
- [x] 按钮权限指令接入后端 permission code
- [x] 无权限菜单不显示
- [x] 无权限按钮不显示
- [x] 无权限路由跳 403

测试：

- [x] Auth store 单元测试
- [x] 登录成功 E2E
- [ ] 登录失败 E2E
- [ ] 刷新后恢复登录态 E2E
- [x] 动态菜单 E2E
- [x] 按钮权限 E2E

## 5. IAM 页面

目标：完成企业后台核心权限管理页面。

### 5.1 用户管理

- [x] 用户列表
- [x] 用户查询：账号、姓名、手机号、状态、部门
- [x] 新增用户
- [x] 编辑用户
- [x] 启用/禁用用户
- [x] 重置密码
- [x] 分配角色
- [x] 删除用户入口
- [x] 用户详情
- [x] 表单校验首版
- [x] 操作权限按钮

### 5.2 部门和岗位

- [x] 部门树首版数据接入
- [x] 新增部门
- [x] 编辑部门
- [x] 删除部门
- [x] 部门排序
- [x] 岗位列表
- [x] 岗位新增编辑删除
- [ ] 部门用户联动查询

### 5.3 角色管理

- [x] 角色列表
- [x] 角色查询首版
- [x] 新增角色
- [x] 编辑角色
- [x] 启用/禁用角色
- [x] 授权菜单
- [x] 授权按钮权限
- [x] 授权数据范围
- [ ] 查看关联用户

### 5.4 菜单和按钮权限

- [x] 菜单树管理首版列表
- [x] 新增目录首版
- [x] 新增菜单
- [x] 新增按钮
- [x] 编辑节点
- [x] 删除节点
- [x] 图标配置
- [x] 路由路径配置
- [x] 组件路径配置
- [x] 权限编码配置
- [x] 显示配置

测试：

- [x] 用户 CRUD E2E 首版
- [x] 角色授权 E2E 首版
- [x] 菜单管理 E2E 首版
- [ ] 权限变化后重新登录生效 E2E

## 6. System 页面

目标：平台配置、字典、日志和通知管理。

- [x] 系统配置列表
- [x] 系统配置新增编辑
- [x] 敏感配置脱敏展示
- [ ] 配置刷新
- [x] 字典类型列表
- [x] 字典项列表
- [ ] 字典组件或 composable
- [x] 操作日志列表
- [x] 登录日志列表
- [ ] 审计日志列表
- [ ] 异常日志列表
- [ ] 公告通知列表
- [ ] 公告通知发布

测试：

- [x] 系统配置 E2E
- [x] 字典管理 E2E
- [x] 日志查询 E2E

## 7. 异步任务和本地消息页面

目标：让管理员可以查看、诊断和干预异步任务。

- [x] 任务列表
- [x] 任务状态筛选
- [ ] 任务详情
- [ ] 任务参数展示
- [x] 执行日志
- [x] 手动重试
- [x] 终止任务
- [x] 人工介入处理首版：人工处理状态可重试或终止
- [x] Outbox 消息列表
- [ ] Outbox 消息详情
- [ ] Outbox 手动重试
- [x] 失败原因展示

测试：

- [x] 异步任务页面 E2E 首版
- [x] 人工介入 E2E 首版
- [x] Outbox 查询 E2E

## 8. 工作流和动态表单页面

目标：提供流程配置、表单设计、发起审批和审批处理能力。

### 8.1 表单能力

- [x] 表单设计器首版：schema JSON 定义和创建入口
- [x] 表单字段配置首版：schema JSON
- [ ] 表单校验配置
- [x] 表单布局配置首版：schema JSON
- [ ] 表单预览
- [x] 表单版本管理首版
- [x] 表单渲染器首版：formData JSON 发起入口
- [ ] 表单只读模式
- [ ] 表单权限控制

### 8.2 流程能力

- [x] 流程定义列表
- [ ] 流程模型导入或设计器接入
- [x] 流程发布首版：创建即发布
- [ ] 流程禁用
- [x] 绑定表单
- [x] 流程发起
- [x] 待办
- [ ] 已办
- [ ] 抄送
- [x] 审批动作：同意、拒绝
- [ ] 审批动作：驳回、撤回、终止
- [x] 审批历史
- [ ] 流程图
- [ ] 流程监控

测试：

- [ ] 表单设计 E2E
- [x] 流程发起 E2E
- [x] 审批通过 E2E
- [ ] 驳回 E2E
- [ ] 历史查询 E2E

## 9. 数据治理页面

目标：配合后端多数据源、分表和诊断能力。

- [x] 数据源列表查看
- [x] 数据源健康状态
- [x] 分表规则查看首版：操作日志和异步任务按月路由
- [x] 分表路由诊断
- [ ] 数据权限范围展示
- [ ] SQL 日志或慢查询查看

## 9.1 文件管理页面

目标：接入后端通用文件模块，支持文件元数据查询、上传、详情和下载。

- [x] 文件列表
- [x] 状态筛选
- [x] 文件上传
- [x] 文件详情
- [x] 文件预览信息入口
- [x] 文件下载
- [x] 动态菜单组件映射：`file/FileListView`
- [x] 文件管理 E2E：菜单、列表、上传、详情
- [ ] 文件内容在线预览渲染
- [ ] 对象存储后端标识和诊断信息增强

## 10. 通用组件和组合式函数

目标：降低业务页面重复代码。

- [ ] `useTable`
- [ ] `useDialogForm`
- [ ] `usePermission`
- [ ] `useDict`
- [ ] `usePagination`
- [ ] `useDownload`
- [ ] 通用查询表单
- [ ] 通用数据表格
- [ ] 通用树选择
- [ ] 通用用户选择
- [ ] 通用角色选择
- [ ] 通用部门选择
- [ ] 通用图标选择

## 11. 自动化测试

目标：形成完整、可持续的前端质量门禁。

- [x] 权限 store unit test
- [x] 首页 E2E
- [x] Auth store unit test
- [x] Request client unit test
- [ ] Router guard unit test
- [ ] 菜单生成 unit test
- [x] 登录 E2E
- [x] 动态菜单 E2E
- [x] 按钮权限 E2E
- [x] 用户角色授权 E2E 首版
- [x] 受限角色菜单和按钮隐藏 E2E
- [x] 系统配置 E2E
- [x] 异步任务重试 E2E 首版
- [x] 流程审批 E2E 首版
- [x] 文件管理 E2E 首版
- [x] Playwright 后端依赖启动策略：`scripts/test-e2e-live-monolith-vm.ps1`
- [x] 前端联调代理切换策略：单体 `8080`、网关 `9000`
- [x] E2E 测试数据初始化策略：live E2E 默认重置 VM MySQL `quickframework` schema
- [x] 测试报告归档

验收：

```powershell
yarn lint
yarn typecheck
yarn test:unit
yarn test:e2e
yarn build
```

## 12. OpenAPI 和代码生成

目标：减少手写 API 类型和接口漂移。

- [x] 后端 OpenAPI 地址确认
- [x] OpenAPI client 生成工具选型
- [x] 生成脚本
- [x] 生成目录约定
- [ ] 生成代码 lint 策略
- [x] API 类型使用规范首版：`src/generated/api/schema.ts` + `client.ts`
- [ ] CI 检查 OpenAPI 是否过期

## 13. 当前优先任务

1. 补齐 401、403 请求层单元测试。
2. 补齐刷新后恢复登录态、登录失败 E2E。
3. 补齐角色关联用户视图。
4. 完善文件内容在线预览渲染。
5. 完善工作流表单预览、校验、已办和驳回/撤回/终止。
6. 完善异步任务详情、任务参数展示和 Outbox 手动重试。
