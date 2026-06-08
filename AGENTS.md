# AGENTS.md

本仓库是 QuickFramework 的 Vue 3 前端脚手架，目标是企业后台通用平台。

## 技术基线

- Vue 3。
- TypeScript。
- Vite。
- Pinia。
- Vue Router。
- Element Plus 作为默认 UI 组件库，除非后续明确更换。
- Axios 或基于 OpenAPI 生成的 typed client。
- Vitest + Vue Test Utils。
- Playwright。
- ESLint + Prettier + Stylelint。
- Yarn 作为包管理器。

## 推荐目录

```text
src/
├── app
├── assets
├── components
├── layouts
├── router
├── stores
├── api
├── permissions
├── modules
│   ├── auth
│   ├── system
│   ├── iam
│   ├── workflow
│   ├── async-task
│   └── file
├── form-engine
├── workflow-designer
└── utils
tests/
├── unit
├── component
└── e2e
```

## 前端功能边界

- 登录、刷新 token、退出登录。
- 后端动态菜单生成路由。
- 按钮权限指令，例如 `v-permission`.
- 用户、部门、角色、菜单、按钮权限管理。
- 系统配置、字典、操作日志、登录日志。
- 异步任务列表、任务详情、重试、终止、人工介入。
- 工作流表单设计、流程发起、待办、已办、审批历史、流程图。
- 文件上传、预览、下载。

## 编码规则

- 页面按业务模块放入 `src/modules/{module}`。
- 跨模块通用组件放 `src/components`。
- 请求类型优先由 OpenAPI 生成，不手写重复 DTO。
- 权限判断集中在 `src/permissions`。
- API 错误、token 过期、traceId、下载响应在请求层统一处理。
- Store 只保存跨页面状态；页面局部状态不要塞进全局 store。
- 表单 schema、流程 schema 必须有类型定义和版本号。
- 不把后端返回的菜单、按钮权限当作安全边界，前端只负责体验。

## UI 约定

- 企业后台优先清晰、紧凑、可扫描。
- 不做营销式首页；登录后第一屏应是工作台、待办或管理界面。
- 表格、搜索区、弹窗、抽屉、详情页保持统一交互。
- 按钮权限隐藏时页面布局不能跳动明显。
- 工作流和表单设计器要优先保证可用性，再做视觉增强。

## 测试要求

建议命令：

```powershell
yarn lint
yarn typecheck
yarn test:unit
yarn test:e2e
yarn test:e2e:live:monolith-vm
yarn build
```

测试覆盖重点：

- 登录流程。
- 动态路由和菜单渲染。
- 按钮权限指令。
- 用户角色授权。
- 系统配置编辑。
- 异步任务重试。
- 工作流发起和审批。
- 表单渲染器。
- 真实后端联调 smoke 使用 `yarn test:e2e:live:monolith-vm`，该命令依赖 `JavaFrameworkBackend/scripts/run-monolith-vm.ps1` 和 Ubuntu VM 中间件，默认会重置 VM MySQL 的 `quickframework` schema。

E2E 使用 Playwright。测试数据应通过后端测试接口、fixture 或数据库迁移初始化，避免依赖手工环境。
本地联调默认使用 Vite 代理，`VITE_API_BASE_URL=/api`，`VITE_API_PROXY_TARGET` 指向后端单体 `http://127.0.0.1:8080` 或云网关 `http://127.0.0.1:9000`。
`.env.local` 是本机配置，不要提交；可从 `.env.monolith.example` 或 `.env.cloud.example` 复制。

## 与后端协作

- API 契约以后端 OpenAPI 为准。
- 前端不要猜测字段含义；字段变更应同步更新 OpenAPI client。
- 菜单路由字段需要包含 `path`、`name`、`component`、`title`、`icon`、`permissions`、`hidden`、`sort`。
- 按钮权限建议使用稳定编码，例如 `system:user:create`。
- 每个 E2E 场景应能说明依赖的后端模块和初始化数据。
