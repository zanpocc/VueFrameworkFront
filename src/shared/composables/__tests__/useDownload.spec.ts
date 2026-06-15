import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDownload } from '../useDownload';

// Mock the http module
vi.mock('@/api/http', () => ({
  http: {
    get: vi.fn().mockResolvedValue({
      data: new Blob(['test content'], { type: 'text/plain' }),
    }),
  },
}));

vi.mock('@/stores/auth-storage', () => ({
  readAccessToken: vi.fn().mockReturnValue('fake-token'),
  clearAccessToken: vi.fn(),
}));

describe('useDownload', () => {
  beforeEach(() => {
    // jsdom doesn't provide URL.createObjectURL — polyfill it
    if (!window.URL.createObjectURL) {
      window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/fake');
    }
    if (!window.URL.revokeObjectURL) {
      window.URL.revokeObjectURL = vi.fn();
    }
  });

  it('download sets downloading to true during fetch', async () => {
    const { download, downloading } = useDownload();
    expect(downloading.value).toBe(false);

    const promise = download('/files/1/download', 'test.txt');
    // downloading should be true during the async operation
    expect(downloading.value).toBe(true);

    await promise;
    expect(downloading.value).toBe(false);
  });

  it('download resets downloading even on error', async () => {
    const { http } = await import('@/api/http');
    (http.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    const { download, downloading } = useDownload();
    await expect(download('/files/1/download', 'test.txt')).rejects.toThrow('Network error');
    expect(downloading.value).toBe(false);
  });
});
