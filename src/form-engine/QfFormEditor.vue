<template>
  <div class="qf-form-editor">
    <el-row :gutter="16">
      <!-- 左栏：字段列表 -->
      <el-col :span="12">
        <div class="qf-form-editor__panel">
          <div class="qf-form-editor__header">
            <span>字段列表 ({{ schema.fields.length }})</span>
            <el-button type="primary" size="small" @click="addField">添加字段</el-button>
          </div>

          <div class="qf-form-editor__list">
            <div
              v-for="(field, index) in schema.fields"
              :key="field.key"
              class="qf-form-editor__field-item"
              :class="{ 'qf-form-editor__field-item--active': selectedIndex === index }"
              @click="selectedIndex = index"
            >
              <div class="qf-form-editor__field-info">
                <span class="qf-form-editor__field-label">{{ field.label }}</span>
                <el-tag size="small" type="info">
                  {{ FIELD_TYPE_LABELS[field.type] || field.type }}
                </el-tag>
                <el-tag v-if="field.required" size="small" type="danger">必填</el-tag>
              </div>
              <div class="qf-form-editor__field-actions">
                <el-button
                  :disabled="index === 0"
                  size="small"
                  text
                  @click.stop="moveField(index, -1)"
                >
                  上移
                </el-button>
                <el-button
                  :disabled="index === schema.fields.length - 1"
                  size="small"
                  text
                  @click.stop="moveField(index, 1)"
                >
                  下移
                </el-button>
                <el-button size="small" text type="danger" @click.stop="removeField(index)">
                  删除
                </el-button>
              </div>
            </div>

            <el-empty v-if="schema.fields.length === 0" description="暂无字段" :image-size="60" />
          </div>
        </div>
      </el-col>

      <!-- 右栏：属性编辑器 -->
      <el-col :span="12">
        <div class="qf-form-editor__panel">
          <div class="qf-form-editor__header">字段属性</div>

          <template v-if="selectedField">
            <el-form
              :model="selectedField"
              :rules="fieldRules"
              label-position="top"
              size="small"
              class="qf-form-editor__props"
            >
              <el-form-item label="字段标识 (key)" prop="key">
                <el-input v-model="selectedField.key" @change="emitSchema" />
              </el-form-item>
              <el-form-item label="显示标签" prop="label">
                <el-input v-model="selectedField.label" @change="emitSchema" />
              </el-form-item>
              <el-form-item label="字段类型" prop="type">
                <el-select
                  v-model="selectedField.type"
                  style="width: 100%"
                  @change="onFieldTypeChange"
                >
                  <el-option
                    v-for="(label, type) in FIELD_TYPE_LABELS"
                    :key="type"
                    :label="label"
                    :value="type"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="必填">
                <el-switch v-model="selectedField.required" @change="emitSchema" />
              </el-form-item>
              <el-form-item label="占位提示">
                <el-input
                  v-model="selectedField.placeholder"
                  placeholder="选填"
                  @change="emitSchema"
                />
              </el-form-item>
              <el-form-item label="禁用">
                <el-switch v-model="selectedField.disabled" @change="emitSchema" />
              </el-form-item>

              <!-- number 类型：min/max -->
              <template v-if="selectedField.type === 'number'">
                <el-form-item label="最小值">
                  <el-input-number
                    v-model="selectedField.min"
                    :controls="false"
                    style="width: 100%"
                    @change="emitSchema"
                  />
                </el-form-item>
                <el-form-item label="最大值">
                  <el-input-number
                    v-model="selectedField.max"
                    :controls="false"
                    style="width: 100%"
                    @change="emitSchema"
                  />
                </el-form-item>
              </template>

              <!-- select/radio/checkbox：选项编辑器 -->
              <template v-if="['select', 'radio', 'checkbox'].includes(selectedField.type)">
                <el-form-item label="选项列表">
                  <div class="qf-form-editor__options">
                    <div
                      v-for="(opt, oi) in selectedField.options"
                      :key="oi"
                      class="qf-form-editor__option-row"
                    >
                      <el-input v-model="opt.label" placeholder="显示文本" @change="emitSchema" />
                      <el-input v-model="opt.value" placeholder="选项值" @change="emitSchema" />
                      <el-button text type="danger" size="small" @click="removeOption(oi)">
                        删除
                      </el-button>
                    </div>
                    <el-button size="small" @click="addOption">添加选项</el-button>
                  </div>
                </el-form-item>
              </template>
            </el-form>
          </template>

          <el-empty v-else description="请选择左侧字段进行编辑" :image-size="60" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  ElRow,
  ElCol,
  ElButton,
  ElTag,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElSelect,
  ElOption,
  ElSwitch,
  ElEmpty,
} from 'element-plus';
import type { FormSchema, FormField } from './types';
import { FIELD_TYPE_LABELS } from './types';

const props = defineProps<{
  modelValue: FormSchema;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: FormSchema];
}>();

const selectedIndex = ref(-1);

const schema = computed(() => props.modelValue);

const selectedField = computed(() => {
  if (selectedIndex.value < 0 || selectedIndex.value >= schema.value.fields.length) {
    return null;
  }
  return schema.value.fields[selectedIndex.value] as FormField | null;
});

const fieldRules = {
  key: [{ required: true, message: '请输入字段标识', trigger: 'blur' }],
  label: [{ required: true, message: '请输入显示标签', trigger: 'blur' }],
  type: [{ required: true, message: '请选择字段类型', trigger: 'change' }],
};

watch(
  () => props.modelValue.fields.length,
  (len) => {
    if (selectedIndex.value >= len) {
      selectedIndex.value = len - 1;
    }
  },
);

function emitSchema() {
  emit('update:modelValue', { ...schema.value, fields: [...schema.value.fields] });
}

function addField() {
  const index = schema.value.fields.length + 1;
  const newField: FormField = {
    key: `field_${index}`,
    label: `字段${index}`,
    type: 'input',
  };
  const updated = { ...schema.value, fields: [...schema.value.fields, newField] };
  emit('update:modelValue', updated);
  selectedIndex.value = updated.fields.length - 1;
}

function removeField(index: number) {
  const fields = [...schema.value.fields];
  fields.splice(index, 1);
  emit('update:modelValue', { ...schema.value, fields });
  if (selectedIndex.value >= fields.length) {
    selectedIndex.value = fields.length - 1;
  }
}

function moveField(index: number, direction: -1 | 1) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= schema.value.fields.length) return;
  const fields = [...schema.value.fields];
  const temp = fields[index]!;
  fields[index] = fields[targetIndex]!;
  fields[targetIndex] = temp;

  // 保留选中字段
  if (selectedIndex.value === index) {
    selectedIndex.value = targetIndex;
  } else if (selectedIndex.value === targetIndex) {
    selectedIndex.value = index;
  }

  emit('update:modelValue', { ...schema.value, fields });
}

function onFieldTypeChange() {
  const field = schema.value.fields[selectedIndex.value];
  if (!field) return;

  // 切换类型时自动初始化 options
  if (['select', 'radio', 'checkbox'].includes(field.type) && !field.options) {
    field.options = [{ label: '选项1', value: 'opt1' }];
  }
  // 切换为 number 时初始化 min/max
  if (field.type === 'number' && field.min === undefined) {
    field.min = undefined;
    field.max = undefined;
  }
  emitSchema();
}

function addOption() {
  const field = schema.value.fields[selectedIndex.value];
  if (!field) return;
  if (!field.options) field.options = [];
  const nextIndex = field.options.length + 1;
  field.options.push({ label: `选项${nextIndex}`, value: `opt${nextIndex}` });
  emitSchema();
}

function removeOption(optIndex: number) {
  const field = schema.value.fields[selectedIndex.value];
  if (!field?.options) return;
  field.options.splice(optIndex, 1);
  emitSchema();
}
</script>

<style scoped>
.qf-form-editor__panel {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  padding: 12px;
  min-height: 400px;
}

.qf-form-editor__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 14px;
}

.qf-form-editor__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.qf-form-editor__field-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.qf-form-editor__field-item:hover {
  background: var(--el-fill-color-light);
}

.qf-form-editor__field-item--active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.qf-form-editor__field-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qf-form-editor__field-label {
  font-size: 13px;
  font-weight: 500;
}

.qf-form-editor__field-actions {
  display: flex;
  gap: 2px;
}

.qf-form-editor__props {
  margin-top: 8px;
}

.qf-form-editor__options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qf-form-editor__option-row {
  display: flex;
  gap: 6px;
  align-items: center;
}
</style>
