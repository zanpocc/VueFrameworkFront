import { describe, expect, it, vi, beforeEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';
import QfFileUpload from '../QfFileUpload.vue';
import { fileApi, type FileObject } from '@/api/file';

vi.mock('@/api/file', () => ({
  fileApi: {
    upload: vi.fn(),
  },
}));

const elMessageError = vi.hoisted(() => vi.fn());
const elMessageWarning = vi.hoisted(() => vi.fn());

vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('element-plus')>();
  return {
    ...actual,
    ElMessage: {
      ...actual.ElMessage,
      error: elMessageError,
      warning: elMessageWarning,
    },
  };
});

const mockedUpload = vi.mocked(fileApi.upload);

function makeFileObject(id: number, name = 'foo.png'): FileObject {
  return {
    id,
    storageType: 'LOCAL',
    bucketName: 'default',
    objectKey: `obj-${id}`,
    originalFilename: name,
    contentType: 'image/png',
    fileSize: 1024,
    fileSha256: '',
    status: 'ACTIVE',
    uploadedBy: 'admin',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };
}

function mountUpload(props: Record<string, unknown> = {}) {
  return mount(QfFileUpload, {
    props: {
      modelValue: null,
      ...props,
    },
    global: { plugins: [ElementPlus] },
  });
}

function fakeUploadChange(raw: File) {
  return {
    name: raw.name,
    raw,
    size: raw.size,
    status: 'ready' as const,
    uid: Date.now(),
  };
}

describe('QfFileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders default upload trigger', () => {
    const wrapper = mountUpload();

    expect(wrapper.find('.el-upload').exists()).toBe(true);
    expect(wrapper.text()).toContain('点击上传');
  });

  it('uploads via fileApi and emits update:modelValue with id for single file', async () => {
    const uploaded = makeFileObject(42);
    mockedUpload.mockResolvedValue(uploaded);

    const wrapper = mountUpload();
    const raw = new File(['hello'], 'hello.png', { type: 'image/png' });

    await (
      wrapper.vm as unknown as { handleChange: (file: unknown) => Promise<void> }
    ).handleChange(fakeUploadChange(raw));
    await flushPromises();

    expect(mockedUpload).toHaveBeenCalledWith(raw);
    const events = wrapper.emitted('update:modelValue');
    expect(events).toBeTruthy();
    const last = events?.[events.length - 1];
    expect(last?.[0]).toBe(42);
    const success = wrapper.emitted('success');
    expect(success?.[0]?.[0]).toMatchObject({ id: 42 });
  });

  it('aggregates ids into array for multi-file uploads', async () => {
    mockedUpload
      .mockResolvedValueOnce(makeFileObject(1, 'a.png'))
      .mockResolvedValueOnce(makeFileObject(2, 'b.png'));

    const wrapper = mountUpload({ multiple: true });
    const vm = wrapper.vm as unknown as { handleChange: (file: unknown) => Promise<void> };

    await vm.handleChange(fakeUploadChange(new File(['a'], 'a.png', { type: 'image/png' })));
    await flushPromises();
    await vm.handleChange(fakeUploadChange(new File(['b'], 'b.png', { type: 'image/png' })));
    await flushPromises();

    const events = wrapper.emitted('update:modelValue');
    expect(events).toBeTruthy();
    const last = events?.[events.length - 1];
    expect(last?.[0]).toEqual([1, 2]);
  });

  it('rejects files larger than maxSize and does not call fileApi', async () => {
    const wrapper = mountUpload({ maxSize: 1 }); // 1 MB
    const raw = new File([new Uint8Array(2 * 1024 * 1024)], 'big.png', { type: 'image/png' });

    await (
      wrapper.vm as unknown as { handleChange: (file: unknown) => Promise<void> }
    ).handleChange(fakeUploadChange(raw));
    await flushPromises();

    expect(mockedUpload).not.toHaveBeenCalled();
    expect(elMessageError).toHaveBeenCalledWith('文件大小不能超过 1MB');
    const errors = wrapper.emitted('error');
    expect(errors?.[0]?.[0]).toContain('1MB');
  });

  it('clears internal cache when modelValue is reset to null', async () => {
    mockedUpload.mockResolvedValue(makeFileObject(9, 'x.png'));

    const wrapper = mountUpload();
    await (
      wrapper.vm as unknown as { handleChange: (file: unknown) => Promise<void> }
    ).handleChange(fakeUploadChange(new File(['x'], 'x.png', { type: 'image/png' })));
    await flushPromises();

    await wrapper.setProps({ modelValue: null });
    await flushPromises();

    // After reset, the file list should be empty (no rendered file items).
    expect(wrapper.findAll('.el-upload-list__item').length).toBe(0);
  });
});
