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
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/html-indent': 'off',
      'vue/html-self-closing': [
        'error',
        {
          html: {
            void: 'always',
            normal: 'always',
            component: 'always',
          },
          svg: 'always',
          math: 'always',
        },
      ],
    },
  },
];
