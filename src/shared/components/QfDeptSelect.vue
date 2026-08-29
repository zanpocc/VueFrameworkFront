<template>
  <el-tree-select
    :model-value="modelValue"
    :data="treeData"
    :placeholder="placeholder"
    :disabled="disabled"
    :multiple="multiple"
    :check-strictly="true"
    :render-after-expand="false"
    node-key="id"
    :props="treeProps"
    class="qf-field--full"
    @update:model-value="emit('update:modelValue', $event)"
    @visible-change="onVisibleChange"
  />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useDeptSelect } from '@/shared/composables/useDeptSelect';

withDefaults(
  defineProps<{
    /** v-model binding: single id or array of ids when multiple. */
    modelValue?: number | number[] | null;
    /** Placeholder text. */
    placeholder?: string;
    /** Whether the select is disabled. */
    disabled?: boolean;
    /** Whether to allow selecting multiple items. */
    multiple?: boolean;
  }>(),
  {
    modelValue: null,
    placeholder: '请选择部门',
    disabled: false,
    multiple: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | null];
}>();

defineOptions({ name: 'QfDeptSelect' });

const { loadDepts, getDeptTree } = useDeptSelect();
const treeData = getDeptTree();

const treeProps = {
  label: 'deptName',
  value: 'id',
  children: 'children',
};

function onVisibleChange(visible: boolean) {
  if (visible) {
    loadDepts();
  }
}

onMounted(loadDepts);
</script>
