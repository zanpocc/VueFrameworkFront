<template>
  <div class="qf-table-actions">
    <template v-for="action in visibleInlineActions" :key="action.label">
      <QfPermissionButton
        v-if="action.permission"
        :code="action.permission"
        text
        :type="action.type ?? 'primary'"
        :disabled="action.disabled"
        @click="action.handler"
      >
        {{ action.label }}
      </QfPermissionButton>
      <el-button
        v-else
        text
        :type="action.type ?? 'primary'"
        :disabled="action.disabled"
        @click="action.handler"
      >
        {{ action.label }}
      </el-button>
    </template>
    <el-dropdown v-if="visibleOverflowActions.length > 0" trigger="hover">
      <el-button text type="primary">
        更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="action in visibleOverflowActions"
            :key="action.label"
            :disabled="action.disabled"
            :class="{ 'qf-table-actions__danger': action.type === 'danger' }"
            @click="action.handler"
          >
            {{ action.label }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElButton, ElDropdown, ElDropdownMenu, ElDropdownItem, ElIcon } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';
import { QfPermissionButton } from '@/shared';
import { useAuthStore } from '@/stores/auth';

export interface QfActionItem {
  /** 按钮文本。 */
  label: string;
  /** 按钮类型，danger 在下拉中红色显示。 */
  type?: 'primary' | 'danger';
  /** 是否禁用。 */
  disabled?: boolean;
  /** 权限编码，有值时按权限过滤可见性。 */
  permission?: string | string[];
  /** 点击回调。 */
  handler: () => void;
}

const props = withDefaults(
  defineProps<{
    /** 操作项列表。 */
    actions: QfActionItem[];
    /** 内联显示的最大按钮数，超出部分折叠到「更多」下拉。默认 2。 */
    maxInline?: number;
  }>(),
  {
    maxInline: 2,
  },
);

const authStore = useAuthStore();

function isActionAllowed(action: QfActionItem): boolean {
  if (!action.permission) return true;
  const codes = Array.isArray(action.permission) ? action.permission : [action.permission];
  return codes.every((code) => authStore.hasPermission(code));
}

const inlineActions = computed(() => props.actions.slice(0, props.maxInline));
const overflowActions = computed(() => props.actions.slice(props.maxInline));

const visibleInlineActions = computed(() => inlineActions.value.filter(isActionAllowed));
const visibleOverflowActions = computed(() => overflowActions.value.filter(isActionAllowed));
</script>

<style scoped>
.qf-table-actions {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.qf-table-actions__danger {
  color: var(--el-color-danger);
}
</style>
