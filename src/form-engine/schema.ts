/**
 * Form Schema 解析 / 序列化 / 工具函数。
 */

import type { FormRules } from 'element-plus';
import type { FormField, FormSchema } from './types';

/** 当前支持的 Schema 版本。 */
const CURRENT_VERSION = 1;

/**
 * 将 schemaJson 字符串解析为 FormSchema 对象。
 * 解析失败时抛出描述性错误。
 */
export function parseSchema(schemaJson: string): FormSchema {
  let raw: unknown;
  try {
    raw = JSON.parse(schemaJson);
  } catch {
    throw new Error('表单 Schema 不是有效的 JSON');
  }

  if (!raw || typeof raw !== 'object') {
    throw new Error('表单 Schema 格式错误：期望对象');
  }

  const obj = raw as Record<string, unknown>;

  // 兼容旧格式：{ fields: [...] } 无 version 字段
  if (!Array.isArray(obj.fields)) {
    throw new Error('表单 Schema 缺少 fields 数组');
  }

  const version = typeof obj.version === 'number' ? obj.version : CURRENT_VERSION;

  if (version > CURRENT_VERSION) {
    console.warn(
      `[QfFormEngine] Schema version ${version} > supported ${CURRENT_VERSION}, rendering may be incomplete`,
    );
  }

  return {
    version,
    fields: (obj.fields as Record<string, unknown>[]).map(normalizeField),
  };
}

/**
 * 将 FormSchema 序列化为 JSON 字符串。
 */
export function serializeSchema(schema: FormSchema): string {
  return JSON.stringify(schema, null, 2);
}

/**
 * 根据 Schema 生成表单默认值对象。
 * 用于 useDialogForm 的 defaults。
 */
export function buildFormDefaults(schema: FormSchema): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const field of schema.fields) {
    if (field.defaultValue !== undefined) {
      defaults[field.key] = field.defaultValue;
    } else {
      defaults[field.key] = defaultForType(field.type);
    }
  }
  return defaults;
}

/**
 * 根据 Schema 生成 Element Plus 表单校验规则。
 */
export function buildFormRules(schema: FormSchema): FormRules {
  const rules: FormRules = {};
  for (const field of schema.fields) {
    const fieldRules: NonNullable<FormRules[string]> = [];

    if (field.required) {
      fieldRules.push({
        required: true,
        message: `${field.label}不能为空`,
        trigger:
          field.type === 'select' || field.type === 'radio' || field.type === 'checkbox'
            ? 'change'
            : 'blur',
      });
    }

    if (field.type === 'number' && (field.min !== undefined || field.max !== undefined)) {
      fieldRules.push({
        type: 'number',
        min: field.min,
        max: field.max,
        message: buildRangeMessage(field),
        trigger: 'blur',
      });
    }

    if (fieldRules.length > 0) {
      rules[field.key] = fieldRules;
    }
  }
  return rules;
}

// ---- internal ----

function normalizeField(raw: Record<string, unknown>, index: number): FormField {
  // 兼容旧 seed data 使用 `name` 而非 `key`
  const key = (raw.key as string) || (raw.name as string) || `field_${index}`;
  return {
    key,
    label: (raw.label as string) || key,
    type: (raw.type as FormField['type']) || 'input',
    required: raw.required === true,
    placeholder: raw.placeholder as string | undefined,
    disabled: raw.disabled === true,
    options: Array.isArray(raw.options) ? raw.options : undefined,
    min: raw.min as number | undefined,
    max: raw.max as number | undefined,
    defaultValue: raw.defaultValue,
  };
}

function defaultForType(type: FormField['type']): unknown {
  switch (type) {
    case 'number':
      return 0;
    case 'checkbox':
      return [];
    case 'dateRange':
      return [];
    default:
      return '';
  }
}

function buildRangeMessage(field: FormField): string {
  const parts: string[] = [];
  if (field.min !== undefined) parts.push(`最小值为 ${field.min}`);
  if (field.max !== undefined) parts.push(`最大值为 ${field.max}`);
  return `${field.label}${parts.join('，')}`;
}
