import { describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';
import { defineComponent, h, ref } from 'vue';
import QfDetailDrawer from '../QfDetailDrawer.vue';

function makeHost(initialVisible = true, loading = false) {
  const visible = ref(initialVisible);

  const Host = defineComponent({
    setup() {
      return () =>
        h(
          QfDetailDrawer as unknown as new () => unknown,
          {
            modelValue: visible.value,
            'onUpdate:modelValue': (value: boolean) => {
              visible.value = value;
            },
            title: '用户详情',
            loading,
          },
          {
            default: () => h('div', { class: 'detail' }, 'Detail content'),
          },
        );
    },
  });

  return { Host, visible };
}

describe('QfDetailDrawer', () => {
  it('renders title and slot content when visible', async () => {
    const { Host } = makeHost(true);

    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { plugins: [ElementPlus] },
    });

    await flushPromises();

    expect(document.body.textContent).toContain('用户详情');
    expect(document.body.querySelector('.detail')?.textContent).toContain('Detail content');

    wrapper.unmount();
  });

  it('renders close button in footer', async () => {
    const { Host } = makeHost(true);

    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { plugins: [ElementPlus] },
    });

    await flushPromises();

    const closeButton = Array.from(document.body.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('关闭'),
    );
    expect(closeButton).toBeTruthy();

    wrapper.unmount();
  });

  it('closes drawer when close button clicked', async () => {
    const { Host, visible } = makeHost(true);

    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { plugins: [ElementPlus] },
    });

    await flushPromises();

    const closeButton = Array.from(document.body.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('关闭'),
    );
    closeButton?.click();
    await flushPromises();

    expect(visible.value).toBe(false);

    wrapper.unmount();
  });
});
