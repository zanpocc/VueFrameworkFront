<template>
  <section class="page">
    <header class="page__header">
      <div>
        <h1>部门管理</h1>
        <p>维护组织树、排序和部门启用状态。</p>
      </div>
      <el-button v-permission="'system:dept:update'" type="primary" @click="openCreate">
        新增部门
      </el-button>
    </header>

    <el-table v-loading="loading" :data="deptTree" border default-expand-all row-key="id">
      <el-table-column prop="deptName" label="部门名称" min-width="180" />
      <el-table-column prop="parentId" label="上级 ID" width="110" />
      <el-table-column prop="sortOrder" label="排序" width="100" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button v-permission="'system:dept:update'" text type="primary" @click="openEdit(row)">
            编辑
          </el-button>
          <el-button
            v-permission="'system:dept:update'"
            text
            type="danger"
            @click="deleteDept(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingDept ? '编辑部门' : '新增部门'" width="480px">
      <el-form label-position="top">
        <el-form-item label="部门名称">
          <el-input v-model="form.deptName" />
        </el-form-item>
        <el-form-item label="上级部门">
          <el-select v-model="form.parentId">
            <el-option label="根部门" :value="0" />
            <el-option
              v-for="dept in depts"
              :key="dept.id"
              :label="dept.deptName"
              :value="dept.id"
              :disabled="editingDept?.id === dept.id"
            />
          </el-select>
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
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { iamApi, type DeptCommand, type SysDept } from '@/api/iam';

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const depts = ref<SysDept[]>([]);
const editingDept = ref<SysDept | null>(null);
const form = reactive<DeptCommand>({
  parentId: 0,
  deptName: '',
  sortOrder: 0,
  status: 'ENABLED',
});
type DeptNode = SysDept & { children?: DeptNode[] };

const deptTree = computed(() => buildDeptTree(depts.value));

async function loadDepts() {
  loading.value = true;
  try {
    depts.value = await iamApi.depts();
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingDept.value = null;
  Object.assign(form, {
    parentId: 0,
    deptName: '',
    sortOrder: 0,
    status: 'ENABLED',
  });
  dialogVisible.value = true;
}

function openEdit(row: SysDept) {
  editingDept.value = row;
  Object.assign(form, {
    parentId: row.parentId,
    deptName: row.deptName,
    sortOrder: row.sortOrder,
    status: row.status,
  });
  dialogVisible.value = true;
}

async function submit() {
  submitting.value = true;
  try {
    if (editingDept.value) {
      await iamApi.updateDept(editingDept.value.id, form);
      ElMessage.success('部门已更新');
    } else {
      await iamApi.createDept(form);
      ElMessage.success('部门已创建');
    }
    dialogVisible.value = false;
    await loadDepts();
  } finally {
    submitting.value = false;
  }
}

async function deleteDept(row: SysDept) {
  await ElMessageBox.confirm(`确认删除部门 ${row.deptName}？`, '删除部门', { type: 'warning' });
  await iamApi.deleteDept(row.id);
  ElMessage.success('部门已删除');
  await loadDepts();
}

function buildDeptTree(items: SysDept[]) {
  const nodeMap = new Map<number, DeptNode>();
  const roots: DeptNode[] = [];

  for (const item of items) {
    nodeMap.set(item.id, { ...item, children: [] });
  }

  for (const node of nodeMap.values()) {
    const parent = nodeMap.get(node.parentId);
    if (parent) {
      parent.children?.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes: DeptNode[]) => {
    nodes.sort((left, right) => left.sortOrder - right.sortOrder || left.id - right.id);
    for (const node of nodes) {
      sortNodes(node.children ?? []);
      if (node.children?.length === 0) {
        delete node.children;
      }
    }
  };
  sortNodes(roots);
  return roots;
}

onMounted(loadDepts);
</script>
