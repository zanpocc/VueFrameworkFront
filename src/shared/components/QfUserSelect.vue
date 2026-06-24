<template>
  <el-select
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :multiple="multiple"
    filterable
    remote
    :remote-method="handleSearch"
    :loading="searching"
    style="width: 100%"
    @update:model-value="emit('update:modelValue', $event)"
    @visible-change="onVisibleChange"
  >
    <el-option
      v-for="user in options"
      :key="user.id"
      :label="`${user.nickname}（${user.username}）`"
      :value="valueKey === 'username' ? user.username : user.id"
    />
  </el-select>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { SysUser } from '@/api/iam';
import { useUserSelect } from '@/shared/composables/useUserSelect';

withDefaults(
  defineProps<{
    /** v-model binding: single value or array when multiple. Type follows valueKey. */
    modelValue?: number | number[] | string | string[] | null;
    /** Placeholder text. */
    placeholder?: string;
    /** Whether the select is disabled. */
    disabled?: boolean;
    /** Whether to allow selecting multiple items. */
    multiple?: boolean;
    /** Which user field to use as the option value. Workflow nodes assign users
     *  by username (Flowable taskAssignee), so pass 'username' there; the default
     *  'id' suits generic id-based bindings. */
    valueKey?: 'id' | 'username';
  }>(),
  {
    modelValue: null,
    placeholder: '请选择用户',
    disabled: false,
    multiple: false,
    valueKey: 'id',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | string | string[] | null];
}>();

defineOptions({ name: 'QfUserSelect' });

const { loadUsers, searchUsers, getUserList } = useUserSelect();
const searching = ref(false);
const options = ref<SysUser[]>([]);

async function handleSearch(query: string) {
  if (!query) {
    options.value = getUserList().value;
    return;
  }
  searching.value = true;
  try {
    options.value = await searchUsers(query);
  } finally {
    searching.value = false;
  }
}

async function onVisibleChange(visible: boolean) {
  if (visible) {
    await loadUsers();
    options.value = getUserList().value;
  }
}

onMounted(async () => {
  await loadUsers();
  options.value = getUserList().value;
});
</script>
