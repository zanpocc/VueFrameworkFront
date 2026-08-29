# QuickFramework 前端 UI 系统

## 当前结论

后台页面采用单一的企业管理台视觉基线：左侧导航、顶部工具栏、页签导航、页面标题区、查询区和内容卡片保持固定结构。业务页面只组合共享组件，不在页面内重新定义颜色、阴影和表单控件宽度。

视觉参考基线为 [vue3-element-admin](https://github.com/youlaitech/vue3-element-admin)，记录版本为 `384696affc831d3fed042238d4953a768db5a945`。项目只借鉴布局密度、导航层级、表格和表单的视觉语言，不复制第三方业务代码。

## 设计令牌

令牌集中在 `src/assets/tokens/`：

- `color.css`：品牌色、页面/卡片/侧栏背景、文字、边框和状态色。
- `spacing.css`：间距、页面内边距、卡片内边距、控件高度和语义字段宽度。
- `typography.css`：标题、正文、辅助文字和字重。
- `border.css`：控件、卡片和圆形元素的圆角。
- `elevation.css`：卡片、弹层、侧栏、节点和焦点态阴影。

暗色模式只覆盖同一组令牌，不允许业务页面写第二套颜色。

## 公共组件

标准页面按下面的组合方式实现：

```vue
<QfPageShell>
  <QfPageHeader title="用户管理" description="维护平台用户。">
    <template #actions>...</template>
  </QfPageHeader>
  <QfSearchPanel>...</QfSearchPanel>
  <QfTablePanel title="用户列表">
    <QfDataTable ... />
  </QfTablePanel>
</QfPageShell>
```

公共组件的职责如下：

- `QfPageShell`：标准页面的布局节奏和最小宽度。
- `QfPageHeader`：页面标题、描述和右侧操作区。
- `QfPageToolbar`：独立路由或嵌入式页面的操作按钮区。
- `QfCard`：工作台、诊断和信息区的统一内容卡片。
- `QfMetricCard`：工作台指标卡，统一图标、数值、辅助说明和状态色，不在工作台内重复实现指标布局。
- `QfSearchPanel`：查询字段、更多条件、查询和重置操作。
- `QfTablePanel`：表格标题、说明、内容和分页的统一容器。
- `QfDataTable`：分页、加载、空状态、筛选和操作列。

## 工作台布局规范

工作台采用固定的信息层级：欢迎上下文、关键指标、主任务区和辅助信息区。指标卡必须使用 `QfMetricCard`，内容区使用 `QfCard`；主任务区占据主要宽度，公告和平台基础信息放入右侧辅助栏。空数据状态也要保留明确的图标、标题和下一步提示，避免卡片只剩大片空白。

## 约束

- 标准业务视图必须使用 `QfPageShell` 和 `QfPageHeader`。
- `QfDataTable` 必须放在 `QfTablePanel` 或 `QfCard` 中。
- 禁止在 `src/modules` 内使用内联 `style="..."`；字段宽度使用 `qf-field--sm/md/lg/xl/full`。
- 禁止在业务视图样式块中写十六进制、RGB、HSL 等颜色值；新颜色先补充设计令牌。
- 业务页面不直接定义卡片阴影、品牌渐变和全局控件皮肤。
- 登录页和流程设计器属于特殊画布/品牌页面，保留独立布局，但视觉值仍必须引用令牌。

## 静态门禁

```powershell
yarn lint:ui
```

该命令由 `scripts/check-ui-contract.mjs` 执行，检查令牌、公共组件导出、标准页面骨架、表格容器、内联样式和业务颜色回流。新增特殊页面必须在脚本的例外清单中登记，并在本文说明原因。

## 验证范围

本轮已纳入类型检查、ESLint、Stylelint、单元测试和生产构建；Playwright 视觉回归暂缓，后续单独确定截图基线后再接入，不影响当前 UI 组件契约。
