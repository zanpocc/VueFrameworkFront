<template>
  <section class="page">
    <header class="page__header">
      <div>
        <h1>岗位管理</h1>
        <p>维护岗位编码、名称、排序和状态。</p>
      </div>
      <el-button v-permission="'system:post:update'" type="primary" @click="openCreate">
        新增岗位
      </el-button>
    </header>

    <el-table v-loading="loading" :data="posts" border row-key="id">
      <el-table-column prop="postCode" label="岗位编码" min-width="160" />
      <el-table-column prop="postName" label="岗位名称" min-width="160" />
      <el-table-column prop="sortOrder" label="排序" width="100" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button v-permission="'system:post:update'" text type="primary" @click="openEdit(row)">
            编辑
          </el-button>
          <el-button
            v-permission="'system:post:update'"
            text
            type="danger"
            @click="deletePost(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingPost ? '编辑岗位' : '新增岗位'" width="480px">
      <el-form label-position="top">
        <el-form-item label="岗位编码">
          <el-input v-model="form.postCode" />
        </el-form-item>
        <el-form-item label="岗位名称">
          <el-input v-model="form.postName" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option label="启用" value="ENABLED" />
            <el-option label="禁用" value="DISABLED" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false"> 取消 </el-button>
        <el-button type="primary" :loading="submitting" @click="submit"> 保存 </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { iamApi, type PostCommand, type SysPost } from '@/api/iam';

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const posts = ref<SysPost[]>([]);
const editingPost = ref<SysPost | null>(null);
const form = reactive<PostCommand>({
  postCode: '',
  postName: '',
  sortOrder: 0,
  status: 'ENABLED',
});

async function loadPosts() {
  loading.value = true;
  try {
    posts.value = await iamApi.posts();
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingPost.value = null;
  Object.assign(form, { postCode: '', postName: '', sortOrder: 0, status: 'ENABLED' });
  dialogVisible.value = true;
}

function openEdit(row: SysPost) {
  editingPost.value = row;
  Object.assign(form, {
    postCode: row.postCode,
    postName: row.postName,
    sortOrder: row.sortOrder,
    status: row.status,
  });
  dialogVisible.value = true;
}

async function submit() {
  submitting.value = true;
  try {
    if (editingPost.value) {
      await iamApi.updatePost(editingPost.value.id, form);
      ElMessage.success('岗位已更新');
    } else {
      await iamApi.createPost(form);
      ElMessage.success('岗位已创建');
    }
    dialogVisible.value = false;
    await loadPosts();
  } finally {
    submitting.value = false;
  }
}

async function deletePost(row: SysPost) {
  await ElMessageBox.confirm(`确认删除岗位 ${row.postName}？`, '删除岗位', { type: 'warning' });
  await iamApi.deletePost(row.id);
  ElMessage.success('岗位已删除');
  await loadPosts();
}

onMounted(loadPosts);
</script>
