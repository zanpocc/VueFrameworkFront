import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ElementPlus from 'element-plus';
import QfTableActions from '../QfTableActions.vue';
import type { QfActionItem } from '../QfTableActions.vue';
import { useAuthStore } from '@/stores/auth';

describe('QfTableActions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const actions: QfActionItem[] = [
    { label: '编辑', handler: vi.fn() },
    { label: '详情', handler: vi.fn() },
    { label: '删除', type: 'danger', handler: vi.fn() },
  ];

  it('renders inline actions up to maxInline', () => {
    const wrapper = mount(QfTableActions, {
      props: { actions, maxInline: 2 },
      global: { plugins: [ElementPlus] },
    });

    // Should have 2 inline buttons + 1 "更多" dropdown trigger
    const buttons = wrapper.findAllComponents({ name: 'ElButton' });
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders "更多" dropdown when actions exceed maxInline', () => {
    const wrapper = mount(QfTableActions, {
      props: { actions, maxInline: 2 },
      global: { plugins: [ElementPlus] },
    });

    const dropdown = wrapper.findComponent({ name: 'ElDropdown' });
    expect(dropdown.exists()).toBe(true);
  });

  it('hides "更多" when all actions fit inline', () => {
    const fewActions = actions.slice(0, 2);
    const wrapper = mount(QfTableActions, {
      props: { actions: fewActions, maxInline: 2 },
      global: { plugins: [ElementPlus] },
    });

    const dropdown = wrapper.findComponent({ name: 'ElDropdown' });
    expect(dropdown.exists()).toBe(false);
  });

  it('filters actions by permissions', () => {
    const store = useAuthStore();
    store.permissions = ['system:user:view'];

    const wrapper = mount(QfTableActions, {
      props: {
        actions: [
          { label: '查看', permission: 'system:user:view', handler: vi.fn() },
          { label: '删除', permission: 'system:user:update', handler: vi.fn() },
        ],
        maxInline: 2,
      },
      global: { plugins: [ElementPlus] },
    });

    expect(wrapper.text()).toContain('查看');
    expect(wrapper.text()).not.toContain('删除');
  });

  it('clicking inline action calls its handler', async () => {
    const handler = vi.fn();
    const testActions: QfActionItem[] = [{ label: '编辑', handler }];
    const wrapper = mount(QfTableActions, {
      props: { actions: testActions, maxInline: 2 },
      global: { plugins: [ElementPlus] },
    });

    const button = wrapper.find('button');
    await button.trigger('click');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('applies danger class to danger-type overflow actions', () => {
    const wrapper = mount(QfTableActions, {
      props: { actions, maxInline: 2 },
      global: { plugins: [ElementPlus] },
      attachTo: document.body,
    });

    // el-dropdown-menu is teleported to body — query the real DOM directly
    const items = document.querySelectorAll('.el-dropdown-menu__item');
    const deleteItem = Array.from(items).find((el) => el.textContent?.includes('删除'));
    expect(deleteItem?.classList.contains('qf-table-actions__danger')).toBe(true);

    wrapper.unmount();
  });
});
