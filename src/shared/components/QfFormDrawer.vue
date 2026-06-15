<template>
  <el-drawer
    :model-value="modelValue"
    :title="title"
    :size="width"
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
      <div class="qf-form-drawer__footer">
        <slot name="footer" :submit="submit" :cancel="handleCancel" :loading="loading">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" :loading="loading" @click="submit">保存</el-button>
        </slot>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts" generic="Model extends object">
import { ref } from 'vue';
import { ElButton, ElDrawer, ElForm, type FormInstance, type FormRules } from 'element-plus';

/**
 * 共享抽屉表单：组合 el-drawer + el-form，统一新增/编辑面板交互。
 *
 * 用法约定：
 * - 父组件通过 v-model 控制显示；
 * - model 与 rules 直接透传给 el-form；
 * - submit 事件只在 form.validate() 通过后触发，父组件无需再次校验；
 * - 关闭抽屉时（取消、遮罩、ESC）不会触发 submit。
 */
const props = defineProps<{
  /** v-model 控制抽屉可见性。 */
  modelValue: boolean;
  /** 抽屉标题。 */
  title: string;
  /** 表单数据对象。 */
  model: Model;
  /** Element Plus 表单校验规则。 */
  rules?: FormRules<Model>;
  /** 抽屉宽度，默认 600px。 */
  width?: string | number;
  /** 提交按钮 loading 状态（由外部接管异步请求）。 */
  loading?: boolean;
}>();

const emit = defineEmits<{
  /** v-model 更新。 */
  (event: 'update:modelValue', value: boolean): void;
  /** 校验通过后触发，回调参数为当前 model 引用。 */
  (event: 'submit', model: Model): void;
  /** 点击取消或外部关闭时触发。 */
  (event: 'cancel'): void;
}>();

const formRef = ref<FormInstance | null>(null);

const width = props.width ?? '600px';

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
.qf-form-drawer__footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
