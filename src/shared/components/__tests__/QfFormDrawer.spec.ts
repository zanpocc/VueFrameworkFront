import { describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import ElementPlus, { ElFormItem, ElInput, type FormRules } from 'element-plus';
import { defineComponent, h, reactive, ref } from 'vue';
import QfFormDrawer from '../QfFormDrawer.vue';

interface DemoModel extends Record<string, unknown> {
  name: string;
}

function makeHost(initialVisible = true, rules?: FormRules<DemoModel>) {
  const model = reactive<DemoModel>({ name: '' });
  const visible = ref(initialVisible);
  const submitted = ref<DemoModel | null>(null);

  const Host = defineComponent({
    setup() {
      return () =>
        h(
          QfFormDrawer as unknown as new () => unknown,
          {
            modelValue: visible.value,
            'onUpdate:modelValue': (value: boolean) => {
              visible.value = value;
            },
            title: '测试抽屉',
            model,
            rules,
            onSubmit: (payload: DemoModel) => {
              submitted.value = { ...payload };
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

  return { Host, model, visible, submitted };
}

describe('QfFormDrawer', () => {
  it('renders the drawer with given title and slot content', async () => {
    const { Host } = makeHost(true);

    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { plugins: [ElementPlus] },
    });

    await flushPromises();

    expect(document.body.textContent).toContain('测试抽屉');
    expect(document.body.querySelector('.el-form-item__label')?.textContent).toContain('名称');

    wrapper.unmount();
  });

  it('emits update:modelValue(false) on cancel', async () => {
    const { Host, visible } = makeHost(true);

    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { plugins: [ElementPlus] },
    });

    await flushPromises();

    const cancelButton = Array.from(document.body.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('取消'),
    );
    expect(cancelButton).toBeTruthy();
    cancelButton?.click();
    await flushPromises();

    expect(visible.value).toBe(false);

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

    const submitButton = Array.from(document.body.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('保存'),
    );
    expect(submitButton).toBeTruthy();
    submitButton?.click();
    await flushPromises();

    expect(submitted.value).toEqual({ name: 'Alice' });

    wrapper.unmount();
  });

  it('does not emit submit when underlying form.validate() rejects', async () => {
    const { Host, submitted } = makeHost(true);

    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { plugins: [ElementPlus] },
    });

    await flushPromises();

    // 注：el-form-item 通过 slot 注入 el-form 上下文存在限制，这里直接 stub validate
    // 验证组件在校验失败时不会触发 submit。
    const drawer = wrapper.findComponent(QfFormDrawer as unknown as new () => unknown);
    const formRef = (drawer.vm as unknown as { formRef: unknown }).formRef as
      | { validate: () => Promise<boolean> }
      | null
      | undefined;

    if (formRef) {
      formRef.validate = () => Promise.reject(new Error('invalid'));
    } else {
      throw new Error('expected formRef to be exposed');
    }

    const submitButton = Array.from(document.body.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('保存'),
    );
    submitButton?.click();
    await flushPromises();

    expect(submitted.value).toBeNull();

    wrapper.unmount();
  });
});
