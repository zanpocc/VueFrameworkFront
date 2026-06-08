export default {
  extends: ['stylelint-config-standard', 'stylelint-config-standard-vue'],
  ignoreFiles: [
    'dist/**',
    'coverage/**',
    'node_modules/**',
    'playwright-report/**',
    'test-results/**',
    'src/generated/api/**',
  ],
  rules: {
    'selector-class-pattern': null,
    'custom-property-pattern': null,
  },
};
