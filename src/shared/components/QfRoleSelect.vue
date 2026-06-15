<template>
  <el-select
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :multiple="multiple"
    filterable
    style="width: 100%"
    @update:model-value="emit('update:modelValue', $event)"
    @visible-change="onVisibleChange"
  >
    <el-option v-for="role in roleList" :key="role.id" :label="role.roleName" :value="role.id" />
  </el-select>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoleSelect } from '@/shared/composables/useRoleSelect';

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
    placeholder: '请选择角色',
    disabled: false,
    multiple: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | null];
}>();

defineOptions({ name: 'QfRoleSelect' });

const { loadRoles, getRoleList } = useRoleSelect();
const roleList = getRoleList();

function onVisibleChange(visible: boolean) {
  if (visible) {
    loadRoles();
  }
}

onMounted(loadRoles);
</script>
