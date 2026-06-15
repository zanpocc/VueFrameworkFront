import { describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import ElementPlus, { ElFormItem, ElInput } from 'element-plus';
import { defineComponent, h, reactive, ref } from 'vue';
import QfFormDialog from '../QfFormDialog.vue';

interface DemoModel extends Record<string, unknown> {
  name: string;
}

function makeHost(initialVisible = true, loading = false) {
  const model = reactive<DemoModel>({ name: '' });
  const visible = ref(initialVisible);
  const submitted = ref<DemoModel | null>(null);
  const cancelled = ref(false);

  const Host = defineComponent({
    setup() {
      return () =>
        h(
          QfFormDialog as unknown as new () => unknown,
          {
            modelValue: visible.value,
            'onUpdate:modelValue': (value: boolean) => {
              visible.value = value;
            },
            title: '测试对话框',
            model,
            loading,
            onSubmit: (payload: DemoModel) => {
              submitted.value = { ...payload };
            },
            onCancel: () => {
              cancelled.value = true;
            },
          },
          {
            default: () =>
              h(ElFormItem, { label: '名称', prop: 'name' }, () =>
                h(ElInput, {
                  modelValue: model.name,
                  'onUpdate:modelValue': (value: string) => {
                    model.name = value;
                  },
                }),
              ),
          },
        );
    },
  });

  return { Host, model, visible, submitted, cancelled };
}

describe('QfFormDialog', () => {
  it('renders the dialog with given title and slot content', async () => {
    const { Host } = makeHost(true);

    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { plugins: [ElementPlus] },
    });

    await flushPromises();

    expect(document.body.textContent).toContain('测试对话框');
    expect(document.body.querySelector('.el-form-item__label')?.textContent).toContain('名称');

    wrapper.unmount();
  });

  it('emits cancel and update:modelValue(false) on cancel button', async () => {
    const { Host, visible, cancelled } = makeHost(true);

    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { plugins: [ElementPlus] },
    });

    await flushPromises();

    const cancelButton = Array.from(document.body.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('取消'),
    );
    expect(cancelButton).toBeTruthy();
    cancelButton?.click();
    await flushPromises();

    expect(cancelled.value).toBe(true);
    expect(visible.value).toBe(false);

    wrapper.unmount();
  });

  it('renders submit button with loading state', async () => {
    const { Host } = makeHost(true, true);

    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { plugins: [ElementPlus] },
    });

    await flushPromises();

    const submitButton = Array.from(document.body.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('保存'),
    );
    expect(submitButton).toBeTruthy();
    expect(submitButton?.classList.contains('is-loading')).toBe(true);

    wrapper.unmount();
  });

  it('emits submit with model payload after clicking save', async () => {
    const { Host, model, submitted } = makeHost(true);

    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { plugins: [ElementPlus] },
    });

    await flushPromises();
    model.name = 'Alice';

    const submitButton = Array.from(document.body.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('保存'),
    );
    expect(submitButton).toBeTruthy();
    submitButton?.click();
    await flushPromises();

    expect(submitted.value).toEqual({ name: 'Alice' });

    wrapper.unmount();
  });
});
