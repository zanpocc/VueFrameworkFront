import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';
import QfFormRenderer from '../QfFormRenderer.vue';
import { parseSchema, buildFormDefaults, buildFormRules, serializeSchema } from '../schema';
import type { FormSchema } from '../types';

describe('schema utilities', () => {
  describe('parseSchema', () => {
    it('parses valid schema JSON', () => {
      const json =
        '{"version":1,"fields":[{"key":"name","label":"姓名","type":"input","required":true}]}';
      const schema = parseSchema(json);
      expect(schema.version).toBe(1);
      expect(schema.fields).toHaveLength(1);
      expect(schema.fields[0]!.key).toBe('name');
    });

    it('handles legacy format without version', () => {
      const json = '{"fields":[{"key":"title","label":"标题","type":"input"}]}';
      const schema = parseSchema(json);
      expect(schema.version).toBe(1);
    });

    it('handles legacy field using name instead of key', () => {
      const json = '{"fields":[{"name":"days","label":"天数","type":"number"}]}';
      const schema = parseSchema(json);
      expect(schema.fields[0]!.key).toBe('days');
    });

    it('throws on invalid JSON', () => {
      expect(() => parseSchema('not json')).toThrow('不是有效的 JSON');
    });

    it('throws on missing fields array', () => {
      expect(() => parseSchema('{}')).toThrow('缺少 fields 数组');
    });
  });

  describe('buildFormDefaults', () => {
    it('generates defaults for each field', () => {
      const schema: FormSchema = {
        version: 1,
        fields: [
          { key: 'name', label: '姓名', type: 'input' },
          { key: 'age', label: '年龄', type: 'number' },
          { key: 'tags', label: '标签', type: 'checkbox' },
        ],
      };
      const defaults = buildFormDefaults(schema);
      expect(defaults.name).toBe('');
      expect(defaults.age).toBe(0);
      expect(defaults.tags).toEqual([]);
    });

    it('uses defaultValue when specified', () => {
      const schema: FormSchema = {
        version: 1,
        fields: [{ key: 'status', label: '状态', type: 'select', defaultValue: 'ACTIVE' }],
      };
      const defaults = buildFormDefaults(schema);
      expect(defaults.status).toBe('ACTIVE');
    });
  });

  describe('buildFormRules', () => {
    it('generates required rule', () => {
      const schema: FormSchema = {
        version: 1,
        fields: [{ key: 'name', label: '姓名', type: 'input', required: true }],
      };
      const rules = buildFormRules(schema);
      expect(rules.name).toBeDefined();
      const nameRules = rules.name as Array<Record<string, unknown>>;
      expect(nameRules[0]!.required).toBe(true);
    });

    it('generates number range rule', () => {
      const schema: FormSchema = {
        version: 1,
        fields: [{ key: 'score', label: '分数', type: 'number', min: 0, max: 100 }],
      };
      const rules = buildFormRules(schema);
      const scoreRules = rules.score as Array<Record<string, unknown>>;
      const rule = scoreRules[0]!;
      expect(rule.type).toBe('number');
      expect(rule.min).toBe(0);
      expect(rule.max).toBe(100);
    });

    it('returns empty rules when no constraints', () => {
      const schema: FormSchema = {
        version: 1,
        fields: [{ key: 'desc', label: '描述', type: 'textarea' }],
      };
      const rules = buildFormRules(schema);
      expect(rules.desc).toBeUndefined();
    });
  });

  describe('serializeSchema', () => {
    it('round-trips through parseSchema', () => {
      const schema: FormSchema = {
        version: 1,
        fields: [{ key: 'title', label: '标题', type: 'input', required: true }],
      };
      const json = serializeSchema(schema);
      const parsed = parseSchema(json);
      expect(parsed.fields[0]!.key).toBe('title');
      expect(parsed.fields[0]!.required).toBe(true);
    });
  });
});

describe('QfFormRenderer', () => {
  const baseSchema: FormSchema = {
    version: 1,
    fields: [
      { key: 'name', label: '姓名', type: 'input', required: true },
      { key: 'desc', label: '描述', type: 'textarea' },
      { key: 'age', label: '年龄', type: 'number', min: 0, max: 150 },
      {
        key: 'color',
        label: '颜色',
        type: 'select',
        options: [
          { label: '红', value: 'red' },
          { label: '蓝', value: 'blue' },
        ],
      },
      { key: 'birthday', label: '生日', type: 'date' },
      { key: 'range', label: '范围', type: 'dateRange' },
      {
        key: 'gender',
        label: '性别',
        type: 'radio',
        options: [
          { label: '男', value: 'M' },
          { label: '女', value: 'F' },
        ],
      },
      {
        key: 'hobbies',
        label: '爱好',
        type: 'checkbox',
        options: [
          { label: '读书', value: 'read' },
          { label: '运动', value: 'sport' },
        ],
      },
    ],
  };

  function mountRenderer(overrides: { disabled?: boolean } = {}) {
    const defaults = buildFormDefaults(baseSchema);
    return mount(QfFormRenderer, {
      props: {
        schema: baseSchema,
        modelValue: defaults,
        disabled: overrides.disabled,
        'onUpdate:modelValue': () => {
          // no-op for test
        },
      },
      global: { plugins: [ElementPlus] },
    });
  }

  it('renders all 8 field types', () => {
    const wrapper = mountRenderer();
    // el-input (input + textarea = 2)
    const inputs = wrapper.findAllComponents({ name: 'ElInput' });
    expect(inputs.length).toBeGreaterThanOrEqual(2);
    // el-input-number
    expect(wrapper.findComponent({ name: 'ElInputNumber' }).exists()).toBe(true);
    // el-select
    expect(wrapper.findComponent({ name: 'ElSelect' }).exists()).toBe(true);
    // el-date-picker (date + dateRange = 2)
    const datePickers = wrapper.findAllComponents({ name: 'ElDatePicker' });
    expect(datePickers.length).toBeGreaterThanOrEqual(2);
    // el-radio-group
    expect(wrapper.findComponent({ name: 'ElRadioGroup' }).exists()).toBe(true);
    // el-checkbox-group
    expect(wrapper.findComponent({ name: 'ElCheckboxGroup' }).exists()).toBe(true);
  });

  it('renders form labels for each field', () => {
    const wrapper = mountRenderer();
    const labels = wrapper.findAll('.el-form-item__label');
    expect(labels.length).toBe(baseSchema.fields.length);
  });

  it('respects disabled prop', () => {
    const wrapper = mountRenderer({ disabled: true });
    const form = wrapper.findComponent({ name: 'ElForm' });
    expect(form.props('disabled')).toBe(true);
  });

  it('emits update:modelValue on field change', async () => {
    const emitted: Record<string, unknown>[] = [];
    const defaults = buildFormDefaults(baseSchema);
    const wrapper = mount(QfFormRenderer, {
      props: {
        schema: { version: 1, fields: [{ key: 'name', label: '姓名', type: 'input' }] },
        modelValue: defaults,
        'onUpdate:modelValue': (v: Record<string, unknown>) => emitted.push(v),
      },
      global: { plugins: [ElementPlus] },
    });

    const input = wrapper.findComponent({ name: 'ElInput' });
    input.vm.$emit('update:modelValue', '张三');
    await wrapper.vm.$nextTick();

    expect(emitted.length).toBeGreaterThan(0);
    expect(emitted[emitted.length - 1]!.name).toBe('张三');
  });
});
