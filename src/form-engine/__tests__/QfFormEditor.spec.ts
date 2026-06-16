import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';
import QfFormEditor from '../QfFormEditor.vue';
import type { FormSchema } from '../types';

describe('QfFormEditor', () => {
  const baseSchema: FormSchema = {
    version: 1,
    fields: [
      { key: 'name', label: '姓名', type: 'input', required: true },
      { key: 'age', label: '年龄', type: 'number' },
    ],
  };

  function mountEditor(schema: FormSchema = baseSchema) {
    return mount(QfFormEditor, {
      props: {
        modelValue: schema,
        'onUpdate:modelValue': () => {
          // re-mount would need to pass updated value
        },
      },
      global: { plugins: [ElementPlus] },
    });
  }

  it('renders field list from schema', () => {
    const wrapper = mountEditor();
    const items = wrapper.findAll('.qf-form-editor__field-item');
    expect(items.length).toBe(2);
    expect(items[0]!.text()).toContain('姓名');
    expect(items[1]!.text()).toContain('年龄');
  });

  it('shows field count in header', () => {
    const wrapper = mountEditor();
    expect(wrapper.text()).toContain('字段列表 (2)');
  });

  it('shows empty state when no fields', () => {
    const emptySchema: FormSchema = { version: 1, fields: [] };
    const wrapper = mountEditor(emptySchema);
    expect(wrapper.text()).toContain('暂无字段');
  });

  it('emits update:modelValue when add field button clicked', async () => {
    const emitted: FormSchema[] = [];
    const wrapper = mount(QfFormEditor, {
      props: {
        modelValue: { version: 1, fields: [] },
        'onUpdate:modelValue': (v: FormSchema) => emitted.push(v),
      },
      global: { plugins: [ElementPlus] },
    });

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('添加字段'));
    expect(addBtn).toBeDefined();
    await addBtn!.trigger('click');

    expect(emitted.length).toBe(1);
    expect(emitted[0]!.fields.length).toBe(1);
    expect(emitted[0]!.fields[0]!.key).toBe('field_1');
  });

  it('emits update:modelValue when remove field', async () => {
    const emitted: FormSchema[] = [];
    const wrapper = mount(QfFormEditor, {
      props: {
        modelValue: baseSchema,
        'onUpdate:modelValue': (v: FormSchema) => emitted.push(v),
      },
      global: { plugins: [ElementPlus] },
    });

    // Click the first field to select it, then find and click delete
    const items = wrapper.findAll('.qf-form-editor__field-item');
    await items[0]!.trigger('click');

    // Find delete buttons in the field actions area
    const deleteBtns = wrapper.findAll('button').filter((b) => b.text().includes('删除'));
    expect(deleteBtns.length).toBeGreaterThan(0);
    await deleteBtns[0]!.trigger('click');

    expect(emitted.length).toBe(1);
    expect(emitted[0]!.fields.length).toBe(1);
  });
});
