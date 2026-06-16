/**
 * 动态表单 Schema 类型定义。
 *
 * 与后端 wf_form_definition.schemaJson 格式对齐。
 * 后端 seed data 使用 `key` 作为字段标识符（非 `name`）。
 */

/** 支持的表单字段类型。 */
export type FormFieldType =
  | 'input'
  | 'textarea'
  | 'number'
  | 'select'
  | 'date'
  | 'dateRange'
  | 'radio'
  | 'checkbox';

/** select / radio / checkbox 的选项。 */
export interface FormFieldOption {
  label: string;
  value: string | number;
}

/** 单个表单字段定义。 */
export interface FormField {
  /** 字段标识，对应 formData 中的 key。 */
  key: string;
  /** 显示标签。 */
  label: string;
  /** 字段类型。 */
  type: FormFieldType;
  /** 是否必填。 */
  required?: boolean;
  /** 占位提示文本。 */
  placeholder?: string;
  /** 是否禁用。 */
  disabled?: boolean;
  /** select / radio / checkbox 的选项列表。 */
  options?: FormFieldOption[];
  /** number 类型的最小值。 */
  min?: number;
  /** number 类型的最大值。 */
  max?: number;
  /** 字段默认值。 */
  defaultValue?: unknown;
}

/** 表单 Schema 顶层结构。 */
export interface FormSchema {
  /** Schema 版本号，当前为 1。 */
  version: number;
  /** 字段列表。 */
  fields: FormField[];
}

/** 所有字段类型标签映射，用于 UI 展示。 */
export const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  input: '单行文本',
  textarea: '多行文本',
  number: '数字',
  select: '下拉选择',
  date: '日期',
  dateRange: '日期范围',
  radio: '单选',
  checkbox: '多选',
};
