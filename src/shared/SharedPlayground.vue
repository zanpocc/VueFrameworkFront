<template>
  <section class="playground">
    <header class="playground__header">
      <h1>共享组件演示</h1>
      <p>仅在开发模式下可访问，用于在不依赖完整业务页面的前提下手工验证 src/shared 组件。</p>
    </header>

    <article class="playground__section">
      <h2>QfPermissionButton</h2>
      <div class="playground__row">
        <QfPermissionButton code="dashboard:view" type="primary">
          可见按钮（dashboard:view）
        </QfPermissionButton>
        <QfPermissionButton code="system:user:fake" type="primary">
          隐藏按钮（无该权限）
        </QfPermissionButton>
        <QfPermissionButton code="system:user:fake" mode="disable" type="primary">
          禁用按钮（disable 模式）
        </QfPermissionButton>
      </div>
    </article>

    <article class="playground__section">
      <h2>QfDataTable</h2>
      <QfDataTable
        ref="tableRef"
        :columns="columns as any"
        :loader="mockLoader"
        :default-filters="{ keyword: '' }"
      >
        <template #filters="{ filters, reload, reset }">
          <el-input
            v-model="(filters as Record<string, string>).keyword"
            placeholder="输入关键字"
            clearable
            style="width: 220px"
          />
          <el-button type="primary" @click="reload">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </template>
        <template #actions="{ row }">
          <el-button text type="primary" @click="showRow(row)">查看</el-button>
        </template>
      </QfDataTable>
    </article>

    <article class="playground__section">
      <h2>QfFormDrawer</h2>
      <el-button type="primary" @click="drawerVisible = true">打开抽屉</el-button>
      <QfFormDrawer
        v-model="drawerVisible"
        title="编辑示例"
        :model="form"
        :rules="rules"
        :loading="drawerLoading"
        @submit="handleSubmit"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
      </QfFormDrawer>
    </article>

    <article class="playground__section">
      <h2>QfFileUpload</h2>
      <QfFileUpload v-model="fileId" :max-size="2" accept="image/*">
        <template #tip>支持单图上传，最大 2MB。</template>
      </QfFileUpload>
      <p>当前 fileId: {{ fileId ?? '未选择' }}</p>
    </article>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { ElButton, ElInput, ElFormItem, ElMessage, type FormRules } from 'element-plus';
import {
  QfDataTable,
  QfFileUpload,
  QfFormDrawer,
  QfPermissionButton,
  type QfTableColumn,
  type QfTableLoaderParams,
  type QfTableLoaderResult,
} from '@/shared';

interface DemoRow extends Record<string, unknown> {
  id: number;
  name: string;
  status: string;
}

const tableRef = ref<InstanceType<typeof QfDataTable> | null>(null);

const columns: QfTableColumn<DemoRow>[] = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '名称', minWidth: 160 },
  { prop: 'status', label: '状态', width: 120 },
];

const mockData: DemoRow[] = Array.from({ length: 27 }, (_, index) => ({
  id: index + 1,
  name: `示例对象 ${index + 1}`,
  status: index % 2 === 0 ? 'ACTIVE' : 'DISABLED',
}));

async function mockLoader(
  params: QfTableLoaderParams,
): Promise<QfTableLoaderResult<Record<string, unknown>>> {
  const keyword = String(params.filters.keyword ?? '').trim();
  const filtered = keyword ? mockData.filter((row) => row.name.includes(keyword)) : mockData;
  const start = (params.page - 1) * params.size;
  const records = filtered.slice(start, start + params.size);
  return { records, total: filtered.length };
}

function showRow(row: unknown) {
  ElMessage.info(`点击了 ${(row as DemoRow).name}`);
}

const drawerVisible = ref(false);
const drawerLoading = ref(false);
const form = reactive({ name: '', description: '' });
const rules: FormRules<typeof form> = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
};

async function handleSubmit() {
  drawerLoading.value = true;
  await new Promise((resolve) => setTimeout(resolve, 300));
  drawerLoading.value = false;
  drawerVisible.value = false;
  ElMessage.success(`提交成功：${form.name}`);
}

const fileId = ref<number | number[] | null>(null);
</script>

<style scoped>
.playground {
  display: grid;
  gap: 24px;
  padding: 24px;
}

.playground__header h1 {
  margin: 0 0 4px;
}

.playground__section {
  display: grid;
  gap: 12px;
  padding: 16px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}

.playground__section h2 {
  margin: 0;
  font-size: 16px;
}

.playground__row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
