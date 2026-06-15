import { describe, expect, it, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ElementPlus from 'element-plus';
import QfPermissionButton from '../QfPermissionButton.vue';
import { useAuthStore } from '@/stores/auth';

function mountButton(props: { code: string | string[]; mode?: 'hide' | 'disable' }, slot = 'OK') {
  return mount(QfPermissionButton, {
    props,
    slots: { default: slot },
    global: {
      plugins: [ElementPlus],
    },
  });
}

describe('QfPermissionButton', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders when permission is granted', () => {
    const store = useAuthStore();
    store.permissions = ['system:user:create'];

    const wrapper = mountButton({ code: 'system:user:create' }, '新增');

    expect(wrapper.find('button').exists()).toBe(true);
    expect(wrapper.text()).toContain('新增');
  });

  it('hides button by default when permission is missing', () => {
    const store = useAuthStore();
    store.permissions = [];

    const wrapper = mountButton({ code: 'system:user:create' });

    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('reacts to permission changes via store', async () => {
    const store = useAuthStore();
    store.permissions = [];

    const wrapper = mountButton({ code: 'system:user:create' });
    expect(wrapper.find('button').exists()).toBe(false);

    store.permissions = ['system:user:create'];
    await wrapper.vm.$nextTick();

    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('disables (instead of hiding) in disable mode when permission missing', () => {
    const store = useAuthStore();
    store.permissions = [];

    const wrapper = mountButton({ code: 'system:user:create', mode: 'disable' });
    const button = wrapper.find('button');

    expect(button.exists()).toBe(true);
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('requires every permission when array is passed', () => {
    const store = useAuthStore();
    store.permissions = ['system:user:create'];

    const wrapper = mountButton({ code: ['system:user:create', 'system:user:update'] });

    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('forwards click events to the underlying el-button', async () => {
    const store = useAuthStore();
    store.permissions = ['system:user:create'];

    let clicked = 0;
    const wrapper = mount(QfPermissionButton, {
      props: { code: 'system:user:create', onClick: () => clicked++ },
      slots: { default: 'Go' },
      global: { plugins: [ElementPlus] },
    });

    await wrapper.find('button').trigger('click');
    expect(clicked).toBe(1);
  });
});
