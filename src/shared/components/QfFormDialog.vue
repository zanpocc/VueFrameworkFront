<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    :width="dialogWidth"
    :before-close="handleClose"
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <el-form
      ref="formRef"
      :model="model"
      :rules="rules"
      label-position="top"
      @submit.prevent="submit"
    >
      <slot />
    </el-form>

    <template #footer>
      <div class="qf-form-dialog__footer">
        <slot name="footer" :submit="submit" :cancel="handleCancel" :loading="loading">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" :loading="loading" @click="submit">保存</el-button>
        </slot>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts" generic="Model extends object">
import { ref } from 'vue';
import { ElButton, ElDialog, ElForm, type FormInstance, type FormRules } from 'element-plus';

/**
 * 共享对话框表单：组合 el-dialog + el-form，统一新增/编辑面板交互。
 *
 * 与 QfFormDrawer 的区别：
 * - 本组件使用 el-dialog，适用于表单字段少、需要快速确认的场景；
 * - QfFormDrawer 使用 el-drawer，适用于字段多、需要更大空间的场景。
 *
 * 用法约定同 QfFormDrawer：
 * - 父组件通过 v-model 控制显示；
 * - model 与 rules 直接透传给 el-form；
 * - submit 事件只在 form.validate() 通过后触发；
 * - 关闭对话框时不会触发 submit。
 */
const props = withDefaults(
  defineProps<{
    /** v-model 控制对话框可见性。 */
    modelValue: boolean;
    /** 对话框标题。 */
    title: string;
    /** 表单数据对象。 */
    model: Model;
    /** Element Plus 表单校验规则。 */
    rules?: FormRules<Model>;
    /** 对话框宽度，默认 520px。 */
    width?: string | number;
    /** 提交按钮 loading 状态（由外部接管异步请求）。 */
    loading?: boolean;
  }>(),
  {
    rules: undefined,
    width: '520px',
    loading: false,
  },
);

const emit = defineEmits<{
  /** v-model 更新。 */
  (event: 'update:modelValue', value: boolean): void;
  /** 校验通过后触发，回调参数为当前 model 引用。 */
  (event: 'submit', model: Model): void;
  /** 点击取消或外部关闭时触发。 */
  (event: 'cancel'): void;
}>();

const formRef = ref<FormInstance | null>(null);

const dialogWidth = typeof props.width === 'number' ? `${props.width}px` : props.width;

async function submit() {
  if (!formRef.value) {
    emit('submit', props.model);
    return;
  }
  const valid = await formRef.value.validate().catch(() => false);
  if (valid) {
    emit('submit', props.model);
  }
}

function handleCancel() {
  emit('cancel');
  emit('update:modelValue', false);
}

function handleClose(done: () => void) {
  emit('cancel');
  done();
}

/** 暴露表单实例，便于父组件在特殊场景下手动调用 resetFields 等方法。 */
defineExpose({ formRef });
</script>

<style scoped>
.qf-form-dialog__footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
