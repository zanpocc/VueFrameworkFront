<template>
  <el-form
    :model="formData"
    :rules="rules"
    :label-position="labelPosition"
    :disabled="disabled"
    :validate-on-rule-change="false"
    class="qf-form-renderer"
  >
    <el-row :gutter="16">
      <el-col v-for="field in schema.fields" :key="field.key" :span="colSpan">
        <el-form-item :label="field.label" :prop="field.key">
          <!-- input -->
          <el-input
            v-if="field.type === 'input'"
            :model-value="getFieldValue(field.key) as string"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :disabled="field.disabled"
            @update:model-value="(v: string) => setFieldValue(field.key, v)"
          />

          <!-- textarea -->
          <el-input
            v-else-if="field.type === 'textarea'"
            type="textarea"
            :rows="3"
            :model-value="getFieldValue(field.key) as string"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :disabled="field.disabled"
            @update:model-value="(v: string) => setFieldValue(field.key, v)"
          />

          <!-- number -->
          <el-input-number
            v-else-if="field.type === 'number'"
            :model-value="(getFieldValue(field.key) as number) ?? undefined"
            :min="field.min"
            :max="field.max"
            :placeholder="field.placeholder"
            :disabled="field.disabled"
            controls-position="right"
            style="width: 100%"
            @update:model-value="(v: number | undefined) => setFieldValue(field.key, v ?? 0)"
          />

          <!-- select -->
          <el-select
            v-else-if="field.type === 'select'"
            :model-value="(getFieldValue(field.key) as string | number | undefined) ?? ''"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :disabled="field.disabled"
            style="width: 100%"
            @update:model-value="
              (v: string | number | boolean | undefined) => setFieldValue(field.key, v ?? '')
            "
          >
            <el-option
              v-for="opt in field.options"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>

          <!-- date -->
          <el-date-picker
            v-else-if="field.type === 'date'"
            type="date"
            :model-value="getFieldValue(field.key) as string"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :disabled="field.disabled"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            @update:model-value="(v: string) => setFieldValue(field.key, v)"
          />

          <!-- dateRange -->
          <el-date-picker
            v-else-if="field.type === 'dateRange'"
            type="daterange"
            :model-value="getFieldValue(field.key) as string[]"
            :start-placeholder="field.placeholder || '开始日期'"
            end-placeholder="结束日期"
            :disabled="field.disabled"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            @update:model-value="(v: string[]) => setFieldValue(field.key, v)"
          />

          <!-- radio -->
          <el-radio-group
            v-else-if="field.type === 'radio'"
            :model-value="(getFieldValue(field.key) as string | number | boolean | undefined) ?? ''"
            :disabled="field.disabled"
            @update:model-value="
              (v: string | number | boolean | undefined) => setFieldValue(field.key, v ?? '')
            "
          >
            <el-radio v-for="opt in field.options" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </el-radio>
          </el-radio-group>

          <!-- checkbox -->
          <el-checkbox-group
            v-else-if="field.type === 'checkbox'"
            :model-value="getFieldValue(field.key) as (string | number)[]"
            :disabled="field.disabled"
            @update:model-value="(v: (string | number)[]) => setFieldValue(field.key, v)"
          >
            <el-checkbox
              v-for="opt in field.options"
              :key="opt.value"
              :value="opt.value"
              :label="opt.label"
            />
          </el-checkbox-group>

          <!-- fallback: input -->
          <el-input
            v-else
            :model-value="String(getFieldValue(field.key) ?? '')"
            :disabled="field.disabled"
            @update:model-value="(v: string) => setFieldValue(field.key, v)"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElSelect,
  ElOption,
  ElDatePicker,
  ElRadioGroup,
  ElRadio,
  ElCheckboxGroup,
  ElCheckbox,
  ElRow,
  ElCol,
} from 'element-plus';
import type { FormSchema } from './types';
import { buildFormRules } from './schema';

const props = withDefaults(
  defineProps<{
    /** 解析后的表单 Schema。 */
    schema: FormSchema;
    /** 表单数据，v-model 双向绑定。 */
    modelValue: Record<string, unknown>;
    /** 是否禁用所有字段（只读模式）。 */
    disabled?: boolean;
    /** 标签位置。 */
    labelPosition?: 'top' | 'left' | 'right';
    /** 列数，1/2/3。 */
    columns?: 1 | 2 | 3;
  }>(),
  {
    disabled: false,
    labelPosition: 'top',
    columns: 1,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>];
}>();

const formData = computed(() => props.modelValue);
const rules = computed(() => buildFormRules(props.schema));
const colSpan = computed(() => 24 / props.columns);

function getFieldValue(key: string): unknown {
  return props.modelValue[key];
}

function setFieldValue(key: string, value: unknown): void {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}

defineExpose({
  /** 供父组件获取内部 el-form 引用以调用 validate 等。 */
  rules,
});
</script>

<style scoped>
.qf-form-renderer {
  width: 100%;
}
</style>
