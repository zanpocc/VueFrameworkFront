<template>
  <main class="login-view">
    <section class="login-panel">
      <h1>{{ t('auth.login.title') }}</h1>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="submit"
      >
        <el-form-item :label="t('auth.login.username')" prop="username">
          <el-input
            v-model="form.username"
            autocomplete="username"
            :placeholder="t('auth.login.usernamePlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('auth.login.password')" prop="password">
          <el-input
            v-model="form.password"
            autocomplete="current-password"
            type="password"
            show-password
            :placeholder="t('auth.login.passwordPlaceholder')"
            @keyup.enter="submit"
          />
        </el-form-item>
        <el-alert
          v-if="errorMessage"
          class="login-panel__error"
          type="error"
          :title="errorMessage"
          show-icon
          :closable="false"
        />
        <el-button
          type="primary"
          native-type="submit"
          class="login-panel__submit"
          :loading="submitting"
          @click="submit"
        >
          {{ t('auth.login.submit') }}
        </el-button>
      </el-form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { FormInstance, FormRules } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const submitting = ref(false);
const errorMessage = ref('');
const formRef = ref<FormInstance>();
const form = reactive({
  username: 'admin',
  password: 'admin123',
});

// FormRules 需要响应 locale 切换：用 computed 让 vue-i18n 的 reactive
// locale 触发表单 rule 重新计算。直接写常量会让切换语言后校验文案不动。
const rules = computed<FormRules<typeof form>>(() => ({
  username: [{ required: true, message: t('auth.login.usernameRequired'), trigger: 'blur' }],
  password: [{ required: true, message: t('auth.login.passwordRequired'), trigger: 'blur' }],
}));

async function submit() {
  if (submitting.value) {
    return;
  }

  errorMessage.value = '';
  await formRef.value?.validate();
  submitting.value = true;
  try {
    await authStore.login(form);
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
    await router.replace(redirect);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('auth.login.failedFallback');
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.login-view {
  display: grid;
  min-height: 100vh;
  place-items: center;
  background: #eef2f7;
}

.login-panel {
  width: min(380px, calc(100vw - 32px));
  padding: 28px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 12px 40px rgb(15 23 42 / 10%);
}

.login-panel h1 {
  margin: 0 0 24px;
  font-size: 24px;
}

.login-panel__error {
  margin-bottom: 16px;
}

.login-panel__submit {
  width: 100%;
}
</style>
