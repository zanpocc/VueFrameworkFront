/// <reference types="vite/client" />

// Element Plus 的 .mjs locale 文件没有类型声明，给个 ambient module 兜一下。
// 用 unknown 而不是 any，业务里仍要走 Language 类型断言。
declare module 'element-plus/dist/locale/zh-cn.mjs' {
  import type { Language } from 'element-plus/es/locale';
  const value: Language;
  export default value;
}

declare module 'element-plus/dist/locale/en.mjs' {
  import type { Language } from 'element-plus/es/locale';
  const value: Language;
  export default value;
}
