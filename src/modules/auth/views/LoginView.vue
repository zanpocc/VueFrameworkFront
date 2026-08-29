<template>
  <main class="login-view">
    <section class="login-view__aside">
      <div class="login-view__brand">
        <span class="login-view__brand-mark">Q</span>
        <div>
          <strong>{{ t('auth.login.title') }}</strong>
          <small>Platform Console</small>
        </div>
      </div>
      <div class="login-view__message">
        <span class="login-view__eyebrow">PLATFORM CONSOLE</span>
        <h2>{{ t('auth.login.tagline') }}</h2>
        <p>{{ t('auth.login.description') }}</p>
      </div>
      <span class="login-view__footer">{{ t('auth.login.footer') }}</span>
    </section>
    <section class="login-panel">
      <div class="login-panel__header">
        <span class="login-panel__eyebrow">{{ t('auth.login.title') }}</span>
        <h1>{{ t('auth.login.welcome') }}</h1>
        <p>{{ t('auth.login.subtitle') }}</p>
      </div>
      <el-form
        ref="formRef"
        class="login-panel__form"
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
      <p class="login-panel__copyright">QuickFramework · Platform Console</p>
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
  grid-template-columns: minmax(360px, 0.9fr) minmax(440px, 1.1fr);
  min-height: 100vh;
  background: var(--qf-color-bg-login);
}

.login-view__aside {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
  padding: 48px clamp(32px, 6vw, 92px);
  overflow: hidden;
  color: #fff;
  background:
    radial-gradient(circle at 85% 14%, rgb(96 165 250 / 32%) 0, transparent 28%),
    linear-gradient(145deg, #0f2d63 0%, #153d82 52%, #1d4ed8 100%);
}

.login-view__aside::before,
.login-view__aside::after {
  position: absolute;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 50%;
  content: '';
}

.login-view__aside::before {
  right: -180px;
  bottom: -210px;
  width: 540px;
  height: 540px;
}

.login-view__aside::after {
  right: 70px;
  bottom: 70px;
  width: 160px;
  height: 160px;
  background: rgb(255 255 255 / 5%);
}

.login-view__brand,
.login-view__message,
.login-view__footer {
  position: relative;
  z-index: 1;
}

.login-view__brand {
  display: flex;
  gap: 12px;
  align-items: center;
}

.login-view__brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  color: #1d4ed8;
  background: #fff;
  border-radius: 11px;
  box-shadow: 0 10px 22px rgb(15 23 42 / 20%);
  font-size: 21px;
  font-weight: 800;
}

.login-view__brand div {
  display: grid;
  gap: 2px;
}

.login-view__brand strong {
  font-size: 16px;
}

.login-view__brand small {
  color: rgb(255 255 255 / 65%);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.login-view__message {
  max-width: 400px;
  margin-top: auto;
  margin-bottom: auto;
}

.login-view__eyebrow,
.login-panel__eyebrow {
  color: var(--el-color-primary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.login-view__eyebrow {
  color: rgb(191 219 254 / 82%);
}

.login-view__message h2 {
  max-width: 360px;
  margin: 14px 0 12px;
  font-size: clamp(30px, 4vw, 46px);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.03em;
}

.login-view__message p {
  max-width: 330px;
  margin: 0;
  color: rgb(219 234 254 / 76%);
  font-size: 14px;
  line-height: 1.8;
}

.login-view__footer {
  color: rgb(219 234 254 / 62%);
  font-size: 12px;
}

.login-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  padding: 56px clamp(28px, 7vw, 100px);
  background: var(--qf-color-bg-surface);
}

.login-panel__header {
  width: min(100%, 390px);
  margin-bottom: 30px;
}

.login-panel__header h1 {
  margin: 10px 0 7px;
  color: var(--qf-color-text-primary);
  font-size: 28px;
  line-height: 1.25;
}

.login-panel__header p {
  margin: 0;
  color: var(--qf-color-text-secondary);
  font-size: 13px;
}

.login-panel__error {
  margin-bottom: 16px;
}

.login-panel__form {
  width: min(100%, 390px);
}

.login-panel__submit {
  width: 100%;
  height: 38px;
  margin-top: 4px;
  border-radius: 6px;
}

.login-panel__copyright {
  width: min(100%, 390px);
  margin: 28px 0 0;
  color: var(--qf-color-text-placeholder);
  font-size: 12px;
  text-align: center;
}

@media (width <= 760px) {
  .login-view {
    display: block;
  }

  .login-view__aside {
    min-height: 190px;
    padding: 26px 24px;
  }

  .login-view__message {
    display: none;
  }

  .login-view__footer {
    margin-top: 38px;
  }

  .login-panel {
    width: 100%;
    min-height: calc(100vh - 190px);
    padding: 38px 24px;
  }
}
</style>
