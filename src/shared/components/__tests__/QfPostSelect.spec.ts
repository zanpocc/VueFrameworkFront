import { describe, expect, it, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ElementPlus from 'element-plus';
import QfPostSelect from '../QfPostSelect.vue';
import { resetPostCache, usePostSelect } from '@/shared/composables/usePostSelect';

const mockPosts = [
  { id: 1, postCode: 'CEO', postName: '总裁', sortOrder: 1, status: 'ENABLED' },
  { id: 2, postCode: 'MGR', postName: '部门经理', sortOrder: 2, status: 'ENABLED' },
];

vi.mock('@/api/iam', () => ({
  iamApi: {
    posts: vi.fn(() => Promise.resolve(mockPosts)),
  },
}));

import { iamApi } from '@/api/iam';

function mountSelect(props: Record<string, unknown> = {}) {
  return mount(QfPostSelect, {
    props,
    global: {
      plugins: [ElementPlus],
    },
  });
}

describe('QfPostSelect', () => {
  beforeEach(() => {
    resetPostCache();
    vi.mocked(iamApi.posts).mockClear();
    vi.mocked(iamApi.posts).mockResolvedValue(mockPosts);
  });

  it('renders loaded posts as options', async () => {
    // Pre-fill the module cache so options exist synchronously at mount time,
    // mirroring how QfIconSelect (static options) is tested. el-select does not
    // render option instances for items added after mount in jsdom.
    await usePostSelect().loadPosts();
    const wrapper = mountSelect();

    const labels = wrapper
      .findAllComponents({ name: 'ElOption' })
      .map((option) => option.props('label'));
    expect(labels).toContain('总裁');
    expect(labels).toContain('部门经理');
  });

  it('fetches posts on mount', async () => {
    mountSelect();
    await flushPromises();
    expect(iamApi.posts).toHaveBeenCalledTimes(1);
  });

  it('emits the selected post id', async () => {
    const wrapper = mountSelect();
    await flushPromises();

    const select = wrapper.findComponent({ name: 'ElSelect' });
    select.vm.$emit('update:modelValue', 2);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([2]);
  });

  it('uses cache and does not re-fetch on second mount', async () => {
    mountSelect();
    await flushPromises();
    mountSelect();
    await flushPromises();

    expect(iamApi.posts).toHaveBeenCalledTimes(1);
  });

  it('renders no options before load completes (empty state)', () => {
    const wrapper = mountSelect();
    const options = wrapper.findAllComponents({ name: 'ElOption' });
    expect(options).toHaveLength(0);
  });
});
