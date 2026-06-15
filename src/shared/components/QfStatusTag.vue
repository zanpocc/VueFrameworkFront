<template>
  <el-tag :type="tagType" :effect="effect" v-bind="tagAttrs">
    {{ displayLabel }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElTag } from 'element-plus';

/**
 * 共享状态标签：将状态值映射为带颜色的 el-tag。
 *
 * 内置默认映射覆盖常见状态码（ENABLED / DISABLED / SUCCESS / FAILED / RETRY / MANUAL_REQUIRED），
 * 业务可通过 mapping / labelMapping prop 覆盖或扩展。
 */
const props = withDefaults(
  defineProps<{
    /** 状态值，例如 'ENABLED'、'FAILED'。 */
    status: string;
    /** 自定义状态→tag type 映射，优先级高于默认映射。 */
    mapping?: Record<string, 'success' | 'warning' | 'danger' | 'info'>;
    /** 自定义状态→显示文本映射，优先级低于 label，高于默认文案。 */
    labelMapping?: Record<string, string>;
    /** 标签显示文本，不提供时直接使用 status 值。 */
    label?: string;
    /** el-tag effect，默认 'light'。 */
    effect?: 'dark' | 'light' | 'plain';
    /** 透传给 el-tag 的额外属性。 */
    tagAttrs?: Record<string, unknown>;
  }>(),
  {
    mapping: () => ({}),
    labelMapping: () => ({}),
    label: undefined,
    effect: 'light',
    tagAttrs: () => ({}),
  },
);

const DEFAULT_MAPPING: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  ENABLED: 'success',
  ACTIVE: 'success',
  SUCCESS: 'success',
  COMPLETED: 'success',
  DISABLED: 'danger',
  INACTIVE: 'danger',
  FAILED: 'danger',
  ERROR: 'danger',
  WARNING: 'warning',
  PENDING: 'warning',
  RUNNING: 'warning',
  PROCESSING: 'warning',
  RETRY: 'warning',
  MANUAL_REQUIRED: 'warning',
  DRAFT: 'info',
  PUBLISHED: 'success',
  APPROVED: 'success',
  REJECTED: 'danger',
  WITHDRAWN: 'info',
  TERMINATED: 'danger',
  CANCELED: 'info',
  CANCELLED: 'info',
  NOT_STARTED: 'info',
  TODO: 'warning',
  APPROVE: 'success',
  REJECT: 'danger',
  START: 'warning',
  IGNORED: 'info',
  ARCHIVED: 'info',
  read: 'success',
  unread: 'warning',
};

const DEFAULT_LABELS: Record<string, string> = {
  ENABLED: '启用',
  ACTIVE: '启用',
  SUCCESS: '成功',
  COMPLETED: '已完成',
  APPROVED: '已通过',
  DISABLED: '禁用',
  INACTIVE: '停用',
  FAILED: '失败',
  ERROR: '异常',
  WARNING: '告警',
  PENDING: '待处理',
  RUNNING: '运行中',
  PROCESSING: '处理中',
  RETRY: '重试中',
  MANUAL_REQUIRED: '待人工处理',
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  REJECTED: '已拒绝',
  WITHDRAWN: '已撤回',
  TERMINATED: '已终止',
  CANCELED: '已取消',
  CANCELLED: '已取消',
  NOT_STARTED: '未开始',
  TODO: '待办',
  APPROVE: '同意',
  REJECT: '拒绝',
  START: '发起',
  IGNORED: '已忽略',
  ARCHIVED: '已归档',
  read: '已读',
  unread: '未读',
};

const tagType = computed(() => {
  return props.mapping[props.status] ?? DEFAULT_MAPPING[props.status] ?? 'info';
});

const displayLabel = computed(() => {
  return (
    props.label ?? props.labelMapping[props.status] ?? DEFAULT_LABELS[props.status] ?? props.status
  );
});
</script>
