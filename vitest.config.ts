import { mergeConfig } from 'vite';
import { createViteConfig } from './vite.config';

export default mergeConfig(createViteConfig('test'), {
  test: {
    environment: 'jsdom',
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**'],
    globals: true,
  },
});
