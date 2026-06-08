<template>
  <section class="page">
    <header class="page__header">
      <div>
        <h1>字典管理</h1>
        <p>维护字典类型和字典项，供前端通用组件复用。</p>
      </div>
      <el-button v-permission="'system:dict:update'" type="primary" @click="openTypeCreate">
        新增类型
      </el-button>
    </header>

    <el-row :gutter="16">
      <el-col :span="10">
        <el-table
          v-loading="loadingTypes"
          :data="dictTypes"
          border
          row-key="id"
          highlight-current-row
          @current-change="selectType"
        >
          <el-table-column prop="dictCode" label="编码" min-width="150" />
          <el-table-column prop="dictName" label="名称" min-width="130" />
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button
                v-permission="'system:dict:update'"
                text
                type="primary"
                @click.stop="openTypeEdit(row)"
              >
                编辑
              </el-button>
              <el-button
                v-permission="'system:dict:update'"
                text
                type="danger"
                @click.stop="deleteType(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-col>
      <el-col :span="14">
        <div class="page__toolbar">
          <span>{{ currentType ? currentType.dictName : '请选择字典类型' }}</span>
          <el-button
            v-permission="'system:dict:update'"
            type="primary"
            :disabled="!currentType"
            @click="openItemCreate"
          >
            新增字典项
          </el-button>
        </div>
        <el-table v-loading="loadingItems" :data="dictItems" border row-key="id">
          <el-table-column prop="itemLabel" label="标签" min-width="140" />
          <el-table-column prop="itemValue" label="值" min-width="120" />
          <el-table-column prop="sortOrder" label="排序" width="90" />
          <el-table-column prop="status" label="状态" width="110" />
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button
                v-permission="'system:dict:update'"
                text
                type="primary"
                @click="openItemEdit(row)"
              >
                编辑
              </el-button>
              <el-button
                v-permission="'system:dict:update'"
                text
                type="danger"
                @click="deleteItem(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-col>
    </el-row>

    <el-dialog
      v-model="typeDialogVisible"
      :title="editingType ? '编辑字典类型' : '新增字典类型'"
      width="480px"
    >
      <el-form label-position="top">
        <el-form-item label="编码">
          <el-input v-model="typeForm.dictCode" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="typeForm.dictName" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="typeForm.status">
            <el-option label="启用" value="ENABLED" />
            <el-option label="禁用" value="DISABLED" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="typeForm.remark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="typeDialogVisible = false"> 取消 </el-button>
        <el-button type="primary" :loading="submitting" @click="submitType"> 保存 </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="itemDialogVisible"
      :title="editingItem ? '编辑字典项' : '新增字典项'"
      width="480px"
    >
      <el-form label-position="top">
        <el-form-item label="字典编码">
          <el-input v-model="itemForm.dictCode" disabled />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="itemForm.itemLabel" />
        </el-form-item>
        <el-form-item label="值">
          <el-input v-model="itemForm.itemValue" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="itemForm.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="itemForm.status">
            <el-option label="启用" value="ENABLED" />
            <el-option label="禁用" value="DISABLED" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="itemForm.remark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="itemDialogVisible = false"> 取消 </el-button>
        <el-button type="primary" :loading="submitting" @click="submitItem"> 保存 </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  systemApi,
  type DictItem,
  type DictItemCommand,
  type DictType,
  type DictTypeCommand,
} from '@/api/system';

const loadingTypes = ref(false);
const loadingItems = ref(false);
const submitting = ref(false);
const typeDialogVisible = ref(false);
const itemDialogVisible = ref(false);
const dictTypes = ref<DictType[]>([]);
const dictItems = ref<DictItem[]>([]);
const currentType = ref<DictType | null>(null);
const editingType = ref<DictType | null>(null);
const editingItem = ref<DictItem | null>(null);
const typeForm = reactive<DictTypeCommand>({
  dictCode: '',
  dictName: '',
  status: 'ENABLED',
  remark: '',
});
const itemForm = reactive<DictItemCommand>({
  dictCode: '',
  itemLabel: '',
  itemValue: '',
  sortOrder: 0,
  status: 'ENABLED',
  remark: '',
});

async function loadTypes() {
  loadingTypes.value = true;
  try {
    dictTypes.value = await systemApi.dictTypes();
    if (!currentType.value && dictTypes.value[0]) {
      await selectType(dictTypes.value[0]);
    }
  } finally {
    loadingTypes.value = false;
  }
}

async function selectType(row: DictType | null) {
  currentType.value = row;
  if (!row) {
    dictItems.value = [];
    return;
  }
  loadingItems.value = true;
  try {
    dictItems.value = await systemApi.dictItems(row.dictCode);
  } finally {
    loadingItems.value = false;
  }
}

function openTypeCreate() {
  editingType.value = null;
  Object.assign(typeForm, { dictCode: '', dictName: '', status: 'ENABLED', remark: '' });
  typeDialogVisible.value = true;
}

function openTypeEdit(row: DictType) {
  editingType.value = row;
  Object.assign(typeForm, {
    dictCode: row.dictCode,
    dictName: row.dictName,
    status: row.status,
    remark: row.remark ?? '',
  });
  typeDialogVisible.value = true;
}

async function submitType() {
  submitting.value = true;
  try {
    if (editingType.value) {
      await systemApi.updateDictType(editingType.value.id, typeForm);
      ElMessage.success('字典类型已更新');
    } else {
      await systemApi.createDictType(typeForm);
      ElMessage.success('字典类型已创建');
    }
    typeDialogVisible.value = false;
    currentType.value = null;
    await loadTypes();
  } finally {
    submitting.value = false;
  }
}

async function deleteType(row: DictType) {
  await ElMessageBox.confirm(`确认删除字典类型 ${row.dictName}？`, '删除字典类型', {
    type: 'warning',
  });
  await systemApi.deleteDictType(row.id);
  ElMessage.success('字典类型已删除');
  currentType.value = null;
  await loadTypes();
}

function openItemCreate() {
  if (!currentType.value) {
    return;
  }
  editingItem.value = null;
  Object.assign(itemForm, {
    dictCode: currentType.value.dictCode,
    itemLabel: '',
    itemValue: '',
    sortOrder: 0,
    status: 'ENABLED',
    remark: '',
  });
  itemDialogVisible.value = true;
}

function openItemEdit(row: DictItem) {
  editingItem.value = row;
  Object.assign(itemForm, {
    dictCode: row.dictCode,
    itemLabel: row.itemLabel,
    itemValue: row.itemValue,
    sortOrder: row.sortOrder,
    status: row.status,
    remark: row.remark ?? '',
  });
  itemDialogVisible.value = true;
}

async function submitItem() {
  submitting.value = true;
  try {
    if (editingItem.value) {
      await systemApi.updateDictItem(editingItem.value.id, itemForm);
      ElMessage.success('字典项已更新');
    } else {
      await systemApi.createDictItem(itemForm);
      ElMessage.success('字典项已创建');
    }
    itemDialogVisible.value = false;
    await selectType(currentType.value);
  } finally {
    submitting.value = false;
  }
}

async function deleteItem(row: DictItem) {
  await ElMessageBox.confirm(`确认删除字典项 ${row.itemLabel}？`, '删除字典项', {
    type: 'warning',
  });
  await systemApi.deleteDictItem(row.id);
  ElMessage.success('字典项已删除');
  await selectType(currentType.value);
}

onMounted(loadTypes);
</script>
