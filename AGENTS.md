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
│   ├── async-task
│   └── file
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
- 文件上传、预览、下载。

## 编码规则

- 页面按业务模块放入 `src/modules/{module}`。
- 跨模块通用组件放 `src/components`。
- 跨模块原子级共享组件放 `src/shared`，详见下方"共享层 src/shared/"。
- 请求类型优先由 OpenAPI 生成，不手写重复 DTO。
- 权限判断集中在 `src/permissions`。
- API 错误、token 过期、traceId、下载响应在请求层统一处理。
- Store 只保存跨页面状态；页面局部状态不要塞进全局 store。
- 业务表单 schema 必须有类型定义和版本号。
- 不把后端返回的菜单、按钮权限当作安全边界，前端只负责体验。
- **国际化**：迁移过 i18n 的页面里禁止裸中文，全部走 `t('namespace.xxx')`；新增 key 必须同时更新 `src/locales/zh-CN/<ns>.ts` 和 `src/locales/en-US/<ns>.ts`。表单 `rules` / 表格 `columns` 这些常量必须包 `computed()`，否则切换语言时 label / message 不更新。可切换语言的覆盖范围与加 locale 步骤见 `JavaFrameworkBackend/docs/i18n.md`。

## 共享层 src/shared/

定位：跨业务模块复用的原子组件层。与 `src/components` 区别在于：

- `src/components` 面向应用壳、布局、菜单、面包屑等"框架级"组件；
- `src/shared` 面向"业务页面里反复出现的同一种交互单元"，例如带权限的按钮、列表 + 筛选、抽屉表单、文件上传。

当前组件：

- `QfPermissionButton`：在 `el-button` 之上叠加权限编码校验。支持 `code: string | string[]` 与 `mode: 'hide' | 'disable'`（默认 `hide`）。相对 `v-permission` 指令，可响应权限变化、可保留按钮位置。
- `QfDataTable`：组合 `el-table` + `el-pagination` 与筛选/操作槽位，统一列表页加载器签名为 `({ page, size, filters }) => Promise<{ records, total }>`，并通过 `defineExpose({ refresh, reload, reset })` 暴露命令式刷新。
- `QfFormDrawer`：组合 `el-drawer` + `el-form` 的新增/编辑面板。`submit` 事件只在 `validate()` 通过后触发，关闭抽屉不会触发提交。
- `QfFileUpload`：基于现有 `fileApi.upload` 的上传组件。`v-model` 暴露文件 id（单文件为 `number`，多文件为 `number[]`），客户端先做大小与数量校验。

新增共享组件的判定：

- 至少有 2 个业务模块（`src/modules/*`）会使用；
- 不依赖单一业务的领域字段；
- 对外只暴露 props/slots/events，不读取业务 store。

只满足前两条的情况，先放入业务模块；满足全部三条再迁移到 `src/shared`。

测试规范：

- 每个共享组件至少覆盖：渲染、prop 响应、事件触发、一个边界情形；
- 测试放在 `src/shared/components/__tests__/*.spec.ts`，由 `yarn test:unit` 统一执行；
- 涉及 axios 的组件统一通过 `vi.mock('@/api/...')` 隔离网络。

本地手工验证可访问 dev-only 路由 `/shared/playground`（仅 `import.meta.env.DEV` 注册），无需进入业务页面。

## UI 约定

- 企业后台优先清晰、紧凑、可扫描。
- 不做营销式首页；登录后第一屏应是工作台、待办或管理界面。
- 表格、搜索区、弹窗、抽屉、详情页保持统一交互。
- 按钮权限隐藏时页面布局不能跳动明显。
- 业务页面要优先保证可用性，再做视觉增强。

### 统一 UI 系统

- 视觉基线、token、页面组合规则和例外说明见 `docs/ui-system.md`。
- 标准业务视图必须组合 `QfPageShell`、`QfPageHeader`、`QfTablePanel` / `QfCard` 等共享组件；禁止自行复制页面骨架。
- 颜色、阴影、圆角和字段宽度必须来自 `src/assets/tokens/` 或语义 class；禁止在 `src/modules` 使用内联 `style="..."`。
- 提交前运行 `yarn lint:ui`。它是 UI 结构契约，不替代类型、ESLint、Stylelint 或单元测试。
- 登录页属于已登记的特殊页面；特殊不等于可以绕过 token 约束。

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
- 真实后端联调 smoke 使用 `yarn test:e2e:live:monolith-vm`，该命令依赖 `JavaFrameworkBackend/ops/scripts/run-monolith-vm.ps1` 和 Ubuntu VM 中间件，默认会重置 VM MySQL 的 `quickframework` schema。

E2E 使用 Playwright。测试数据应通过后端测试接口、fixture 或数据库迁移初始化，避免依赖手工环境。
本地联调默认使用 Vite 代理，`VITE_API_BASE_URL=/api`，`VITE_API_PROXY_TARGET` 指向后端单体 `http://127.0.0.1:8080` 或云网关 `http://127.0.0.1:9000`。
`.env.local` 是本机配置，不要提交；可从 `.env.monolith.example` 或 `.env.cloud.example` 复制。

## 与后端协作

- API 契约以后端 OpenAPI 为准。
- 前端不要猜测字段含义；字段变更应同步更新 OpenAPI client。
- 菜单路由字段需要包含 `path`、`name`、`component`、`title`、`icon`、`permissions`、`hidden`、`sort`。
- 按钮权限建议使用稳定编码，例如 `system:user:create`。
- 每个 E2E 场景应能说明依赖的后端模块和初始化数据。
