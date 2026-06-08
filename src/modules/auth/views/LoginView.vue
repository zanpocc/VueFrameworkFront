<template>
  <main class="login-view">
    <section class="login-panel">
      <h1>QuickFramework</h1>
      <el-form label-position="top" @submit.prevent="submit">
        <el-form-item label="账号">
          <el-input v-model="form.username" autocomplete="username" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            autocomplete="current-password"
            type="password"
            show-password
            placeholder="请输入密码"
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
          登录
        </el-button>
      </el-form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const submitting = ref(false);
const errorMessage = ref('');
const form = reactive({
  username: 'admin',
  password: 'admin123',
});

async function submit() {
  if (submitting.value) {
    return;
  }

  errorMessage.value = '';
  submitting.value = true;
  try {
    await authStore.login(form);
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
    await router.replace(redirect);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录失败，请检查账号和密码';
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
