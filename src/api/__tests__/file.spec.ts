import { describe, it, expect, vi, beforeEach } from 'vitest';

// Isolate the network layer: replace the axios instance with spies and keep a
// faithful copy of unwrap so file.ts's `.then(unwrap)` behaves like production.
vi.mock('@/api/http', () => ({
  http: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
  unwrap: (response: { data: { success: boolean; code: string; message: string; data: unknown } }) => {
    if (!response.data.success) {
      throw new Error(response.data.message || response.data.code);
    }
    return response.data.data;
  },
}));

import { fileApi } from '@/api/file';
import { http } from '@/api/http';

const post = vi.mocked(http.post);
const put = vi.mocked(http.put);

/** Wrap a payload in the ApiResult envelope an axios response would carry. */
function ok<T>(data: T) {
  return Promise.resolve({ data: { success: true, code: '0', message: '', data, timestamp: '' } });
}

const THRESHOLD = 8 * 1024 * 1024;

/**
 * A File-like stub that lets us drive `upload()` without allocating multi-MB
 * buffers. `arrayBuffer()` feeds the real crypto.subtle.digest (sha256), and
 * `slice()` returns a tiny Blob because uploadPart is mocked anyway.
 */
function fakeFile(size: number, name = 'video.mp4', type = 'video/mp4'): File {
  return {
    name,
    type,
    size,
    arrayBuffer: () => Promise.resolve(new TextEncoder().encode('multipart-hash-source')),
    slice: () => new Blob(['x']),
  } as unknown as File;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('fileApi.upload', () => {
  it('uploads a small file through the legacy single POST /files', async () => {
    const fileObject = { id: 7, originalFilename: 'a.txt' };
    post.mockImplementation((url: string) => {
      if (url === '/files') {
        return ok(fileObject);
      }
      return Promise.reject(new Error(`unexpected POST ${url}`));
    });
    const file = new File(['hi'], 'a.txt', { type: 'text/plain' });

    const result = await fileApi.upload(file);

    expect(result).toEqual(fileObject);
    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0][0]).toBe('/files');
    expect(post.mock.calls[0][1]).toBeInstanceOf(FormData);
    // Large-file endpoints are never touched for a small file.
    expect(put).not.toHaveBeenCalled();
  });

  it('uploads a large file via init → parts → complete', async () => {
    const completed = { id: 42, originalFilename: 'video.mp4', status: 'ACTIVE' };
    post.mockImplementation((url: string) => {
      if (url === '/files/multipart/init') {
        return ok({ uploadId: 99, objectKey: '2026/06/29/video.mp4', partSize: THRESHOLD, partCount: 2, uploadedParts: [], file: null });
      }
      if (url === '/files/multipart/99/complete') {
        return ok(completed);
      }
      return Promise.reject(new Error(`unexpected POST ${url}`));
    });
    put.mockImplementation((url: string) =>
      ok({ partNumber: Number(url.split('/').pop()), etag: 'etag', partSize: THRESHOLD, status: 'UPLOADED' }),
    );
    const file = fakeFile(THRESHOLD + 1024);

    const result = await fileApi.upload(file);

    expect(result).toEqual(completed);
    // init sent a 64-char hex sha256.
    const initBody = post.mock.calls.find((call) => call[0] === '/files/multipart/init')?.[1] as { fileSha256: string; partCount: number };
    expect(initBody.fileSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(initBody.partCount).toBe(2);
    // Two parts uploaded over PUT.
    expect(put).toHaveBeenCalledTimes(2);
    expect(put.mock.calls[0][0]).toBe('/files/multipart/99/parts/1');
    expect(put.mock.calls[1][0]).toBe('/files/multipart/99/parts/2');
    // complete was reached.
    expect(post.mock.calls.some((call) => call[0] === '/files/multipart/99/complete')).toBe(true);
  });

  it('returns the existing file on an instant-upload (秒传) hit without uploading parts', async () => {
    const existing = { id: 5, originalFilename: 'video.mp4', objectKey: '2026/06/29/old.mp4', status: 'ACTIVE' };
    post.mockImplementation((url: string) => {
      if (url === '/files/multipart/init') {
        return ok({ uploadId: null, objectKey: '2026/06/29/old.mp4', partSize: THRESHOLD, partCount: 2, uploadedParts: [], file: existing });
      }
      return Promise.reject(new Error(`unexpected POST ${url}`));
    });
    const file = fakeFile(THRESHOLD + 1024);

    const result = await fileApi.upload(file);

    expect(result).toEqual(existing);
    // No parts, no complete — only init was called.
    expect(put).not.toHaveBeenCalled();
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('aborts the session and rethrows when a part upload fails', async () => {
    const abort = vi.fn(() => ok(undefined));
    post.mockImplementation((url: string) => {
      if (url === '/files/multipart/init') {
        return ok({ uploadId: 77, objectKey: '2026/06/29/video.mp4', partSize: THRESHOLD, partCount: 2, uploadedParts: [], file: null });
      }
      if (url === '/files/multipart/77/abort') {
        return abort();
      }
      return Promise.reject(new Error(`unexpected POST ${url}`));
    });
    const partError = new Error('network down');
    put.mockRejectedValue(partError);
    const file = fakeFile(THRESHOLD + 1024);

    await expect(fileApi.upload(file)).rejects.toBe(partError);
    expect(abort).toHaveBeenCalledTimes(1);
    // complete must never run after a failed part.
    expect(post.mock.calls.some((call) => call[0] === '/files/multipart/77/complete')).toBe(false);
  });
});
