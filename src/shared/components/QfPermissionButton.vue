<template>
  <el-button
    v-if="visible"
    v-bind="$attrs"
    :disabled="disabledByPermission || ($attrs.disabled as boolean | undefined)"
  >
    <slot />
  </el-button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElButton } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

/**
 * 共享按钮：在 el-button 之上叠加权限校验。
 *
 * 与 v-permission 指令的区别：
 * - 指令在 mounted 时直接 el.remove()，无法响应权限变化；
 * - 本组件基于 authStore 计算可见性，可在登录态切换后自动更新；
 * - 支持 disable 模式：保留按钮但禁用，便于呈现"功能存在但当前无权限"的语义。
 */
const props = defineProps<{
  /** 必填，单个权限编码（例如 `system:user:create`）或编码数组（要求全部具备）。 */
  code: string | string[];
  /**
   * 无权限时的处理方式：
   * - `hide`（默认）：完全不渲染按钮，用于普通操作；
   * - `disable`：渲染但禁用，用于希望保留布局或暗示功能存在的场景。
   */
  mode?: 'hide' | 'disable';
}>();

defineOptions({
  inheritAttrs: false,
});

const authStore = useAuthStore();

const required = computed(() => (Array.isArray(props.code) ? props.code : [props.code]));

const allowed = computed(() =>
  required.value.every((permission) => authStore.hasPermission(permission)),
);

const mode = computed(() => props.mode ?? 'hide');

const visible = computed(() => allowed.value || mode.value === 'disable');

const disabledByPermission = computed(() => !allowed.value && mode.value === 'disable');
</script>
