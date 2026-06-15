<template>
  <el-drawer
    :model-value="modelValue"
    :title="title"
    :size="width"
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <div v-loading="loading" class="qf-detail-drawer__content">
      <slot />
    </div>

    <template #footer>
      <div class="qf-detail-drawer__footer">
        <slot name="footer">
          <el-button @click="emit('update:modelValue', false)">关闭</el-button>
        </slot>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ElButton, ElDrawer, vLoading } from 'element-plus';

/**
 * 共享详情抽屉：最小化只读详情面板。
 *
 * 与 QfFormDrawer 的区别：
 * - 本组件不包含 el-form，适用于只读展示；
 * - QfFormDrawer 包含 el-form + 校验 + 提交，适用于新增/编辑。
 */
withDefaults(
  defineProps<{
    /** v-model 控制抽屉可见性。 */
    modelValue: boolean;
    /** 抽屉标题。 */
    title: string;
    /** 抽屉宽度，默认 600px。 */
    width?: string | number;
    /** 内容区 loading 状态。 */
    loading?: boolean;
  }>(),
  {
    width: '600px',
    loading: false,
  },
);

const emit = defineEmits<{
  /** v-model 更新。 */
  (event: 'update:modelValue', value: boolean): void;
}>();
</script>

<style scoped>
.qf-detail-drawer__content {
  min-height: 100px;
}

.qf-detail-drawer__footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
