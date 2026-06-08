import createClient from 'openapi-fetch';
import { readAccessToken } from '@/stores/auth-storage';
import type { paths } from './schema';

export const openApiClient = createClient<paths>({
  baseUrl: import.meta.env.VITE_OPENAPI_BASE_URL || '',
});

openApiClient.use({
  onRequest({ request }) {
    const token = readAccessToken();
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
    return request;
  },
});
