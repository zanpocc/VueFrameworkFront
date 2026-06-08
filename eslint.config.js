import pluginVue from 'eslint-plugin-vue';
import tseslint from '@vue/eslint-config-typescript';

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'playwright-report/**', 'node_modules/**'],
  },
  ...pluginVue.configs['flat/recommended'],
  ...tseslint(),
  {
    rules: {
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
    },
  },
];
