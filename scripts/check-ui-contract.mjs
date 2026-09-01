import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');

const toProjectPath = (filePath) => path.relative(projectRoot, filePath).split(path.sep).join('/');

function walk(directory, predicate) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(entryPath, predicate);
    return predicate(entryPath) ? [entryPath] : [];
  });
}

function fail(message) {
  violations.push(`- ${message}`);
}

const violations = [];
const tokenDirectory = path.join(projectRoot, 'src/assets/tokens');
const tokenText = walk(tokenDirectory, (filePath) => filePath.endsWith('.css'))
  .map((filePath) => fs.readFileSync(filePath, 'utf8'))
  .join('\n');

const requiredTokens = [
  '--qf-color-primary',
  '--qf-color-bg-page',
  '--qf-color-bg-surface',
  '--qf-color-sidebar-active',
  '--qf-border-radius',
  '--qf-spacing-lg',
  '--qf-font-size-heading',
  '--qf-shadow-panel',
];

for (const token of requiredTokens) {
  if (!tokenText.includes(`${token}:`)) {
    fail(`设计令牌缺失：${token}`);
  }
}

const publicComponents = [
  'QfPageShell',
  'QfPageHeader',
  'QfPageToolbar',
  'QfCard',
  'QfMetricCard',
  'QfSearchPanel',
  'QfTablePanel',
  'QfDataTable',
];
const sharedIndex = fs.readFileSync(path.join(projectRoot, 'src/shared/index.ts'), 'utf8');
for (const component of publicComponents) {
  const componentFile = path.join(projectRoot, `src/shared/components/${component}.vue`);
  if (!fs.existsSync(componentFile)) fail(`共享组件文件缺失：${component}.vue`);
  if (!sharedIndex.includes(`as ${component}`)) fail(`共享组件未从 src/shared 导出：${component}`);
}

const customViewExemptions = new Set(['src/modules/auth/views/LoginView.vue']);
const viewFiles = walk(path.join(projectRoot, 'src/modules'), (filePath) =>
  filePath.endsWith('View.vue'),
);
const standardViews = viewFiles.filter(
  (filePath) => !customViewExemptions.has(toProjectPath(filePath)),
);

for (const filePath of standardViews) {
  const projectPath = toProjectPath(filePath);
  const source = fs.readFileSync(filePath, 'utf8');
  if (!source.includes('<QfPageShell')) fail(`${projectPath} 未使用 QfPageShell`);
  if (!source.includes('<QfPageHeader')) fail(`${projectPath} 未使用 QfPageHeader`);
  if (source.includes('<section class="page"') || source.includes('class="page__header"')) {
    fail(`${projectPath} 仍使用旧的 page/page__header 私有页面骨架`);
  }

  if (/(?<!:)\bstyle\s*=/.test(source)) {
    fail(`${projectPath} 含有内联 style，请改用 token 或 qf-field-* 语义 class`);
  }

  if (
    source.includes('<QfDataTable') &&
    !source.includes('<QfTablePanel') &&
    !source.includes('<QfCard')
  ) {
    fail(`${projectPath} 的 QfDataTable 未放入 QfTablePanel/QfCard`);
  }

  const styleBlocks = [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(
    (match) => match[1],
  );
  const privateColorPattern = /#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\(/i;
  if (styleBlocks.some((style) => privateColorPattern.test(style))) {
    fail(`${projectPath} 的样式包含硬编码颜色，请移入 src/assets/tokens`);
  }
}

const moduleFiles = walk(path.join(projectRoot, 'src/modules'), (filePath) =>
  filePath.endsWith('.vue'),
);
for (const filePath of moduleFiles) {
  const projectPath = toProjectPath(filePath);
  const source = fs.readFileSync(filePath, 'utf8');
  if (/(?<!:)\bstyle\s*=/.test(source)) {
    fail(`${projectPath} 含有内联 style，请改用共享 token/class`);
  }
}

if (violations.length > 0) {
  console.error(
    `UI contract failed (${violations.length} violation${violations.length === 1 ? '' : 's'}):`,
  );
  console.error(violations.join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `UI contract passed: ${standardViews.length} standard views, ${publicComponents.length} public components.`,
  );
}
