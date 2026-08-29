<template>
  <QfPageShell>
    <QfPageHeader title="字典管理" description="维护字典类型和字典项，供前端通用选项复用。" />

    <QfSearchPanel @search="searchDicts" @reset="resetSearch">
      <el-form-item label="类型">
        <el-input
          v-model="typeQuery.keyword"
          clearable
          placeholder="编码或名称"
          class="dict-page__filter"
          @keyup.enter="searchDicts"
        />
      </el-form-item>
      <el-form-item label="字典项">
        <el-input
          v-model="itemQuery.keyword"
          clearable
          placeholder="标签或值"
          class="dict-page__filter"
          @keyup.enter="searchDicts"
        />
      </el-form-item>
      <template #more>
        <el-form-item label="类型状态">
          <el-select
            v-model="typeQuery.status"
            clearable
            placeholder="请选择"
            class="dict-page__filter"
          >
            <el-option label="启用" value="ENABLED" />
            <el-option label="禁用" value="DISABLED" />
          </el-select>
        </el-form-item>
        <el-form-item label="字典项状态">
          <el-select
            v-model="itemQuery.status"
            clearable
            placeholder="请选择"
            class="dict-page__filter"
          >
            <el-option label="启用" value="ENABLED" />
            <el-option label="禁用" value="DISABLED" />
          </el-select>
        </el-form-item>
      </template>
    </QfSearchPanel>

    <div class="dict-page__tables">
      <QfTablePanel title="字典类型" description="选择类型后维护右侧字典项">
        <template #actions>
          <QfPermissionButton
            code="system:dict:update"
            type="primary"
            :icon="Plus"
            @click="openTypeCreate"
          >
            新增类型
          </QfPermissionButton>
          <QfPermissionButton
            code="system:dict:update"
            plain
            :icon="Edit"
            :disabled="!currentType"
            @click="openCurrentTypeEdit"
          >
            编辑类型
          </QfPermissionButton>
          <QfPermissionButton
            code="system:dict:update"
            type="danger"
            plain
            :icon="Delete"
            :disabled="!currentType"
            @click="deleteCurrentType"
          >
            删除类型
          </QfPermissionButton>
        </template>
        <QfDataTable
          :columns="typeColumns"
          :data="filteredTypeRows"
          :loading="typeTable.loading.value"
          :page-size="20"
          :actions-width="130"
          :table-attrs="{ highlightCurrentRow: true }"
          @row-click="selectType"
        >
          <template #status="{ row }">
            <QfStatusTag :status="(row as DictType).status" />
          </template>
          <template #actions="{ row }">
            <QfPermissionButton
              code="system:dict:update"
              text
              type="primary"
              @click.stop="openTypeEdit(row as DictType)"
            >
              编辑
            </QfPermissionButton>
            <QfPermissionButton
              code="system:dict:update"
              text
              type="danger"
              @click.stop="deleteType(row as DictType)"
            >
              删除
            </QfPermissionButton>
          </template>
        </QfDataTable>
      </QfTablePanel>

      <QfTablePanel
        title="字典项"
        :description="currentType ? `当前类型：${currentType.dictName}` : '请先选择左侧字典类型'"
      >
        <template #actions>
          <QfPermissionButton
            code="system:dict:update"
            type="primary"
            :icon="Plus"
            :disabled="!currentType"
            @click="openItemCreate"
          >
            新增字典项
          </QfPermissionButton>
        </template>
        <QfDataTable
          :columns="itemColumns"
          :data="filteredItemRows"
          :loading="itemTable.loading.value"
          :page-size="20"
          :actions-width="130"
        >
          <template #status="{ row }">
            <QfStatusTag :status="(row as DictItem).status" />
          </template>
          <template #actions="{ row }">
            <QfPermissionButton
              code="system:dict:update"
              text
              type="primary"
              @click="openItemEdit(row as DictItem)"
            >
              编辑
            </QfPermissionButton>
            <QfPermissionButton
              code="system:dict:update"
              text
              type="danger"
              @click="deleteItem(row as DictItem)"
            >
              删除
            </QfPermissionButton>
          </template>
        </QfDataTable>
      </QfTablePanel>
    </div>

    <QfFormDialog
      v-model="typeDialogVisible"
      :title="editingType ? '编辑字典类型' : '新增字典类型'"
      :model="typeForm"
      :rules="typeRules"
      :loading="submitting"
      width="480px"
      @submit="submitType"
    >
      <el-form-item label="编码" prop="dictCode">
        <el-input v-model="typeForm.dictCode" />
      </el-form-item>
      <el-form-item label="名称" prop="dictName">
        <el-input v-model="typeForm.dictName" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="typeForm.status">
          <el-option label="启用" value="ENABLED" />
          <el-option label="禁用" value="DISABLED" />
        </el-select>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="typeForm.remark" />
      </el-form-item>
    </QfFormDialog>

    <QfFormDialog
      v-model="itemDialogVisible"
      :title="editingItem ? '编辑字典项' : '新增字典项'"
      :model="itemForm"
      :rules="itemRules"
      :loading="submitting"
      width="480px"
      @submit="submitItem"
    >
      <el-form-item label="字典编码" prop="dictCode">
        <el-input v-model="itemForm.dictCode" disabled />
      </el-form-item>
      <el-form-item label="标签" prop="itemLabel">
        <el-input v-model="itemForm.itemLabel" />
      </el-form-item>
      <el-form-item label="值" prop="itemValue">
        <el-input v-model="itemForm.itemValue" />
      </el-form-item>
      <el-form-item label="排序" prop="sortOrder">
        <el-input-number v-model="itemForm.sortOrder" :min="0" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="itemForm.status">
          <el-option label="启用" value="ENABLED" />
          <el-option label="禁用" value="DISABLED" />
        </el-select>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="itemForm.remark" />
      </el-form-item>
    </QfFormDialog>
  </QfPageShell>
</template>

<script setup lang="ts">
defineOptions({ name: 'DictList' });
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormRules } from 'element-plus';
import { Delete, Edit, Plus } from '@element-plus/icons-vue';
import {
  QfDataTable,
  QfFormDialog,
  QfPageHeader,
  QfPageShell,
  QfPermissionButton,
  QfSearchPanel,
  QfStatusTag,
  QfTablePanel,
} from '@/shared';
import type { QfTableColumn } from '@/shared';
import { useTable } from '@/shared';
import {
  systemApi,
  type DictItem,
  type DictItemCommand,
  type DictType,
  type DictTypeCommand,
} from '@/api/system';

const typeColumns: QfTableColumn<DictType>[] = [
  { prop: 'dictCode', label: '编码', minWidth: 150 },
  { prop: 'dictName', label: '名称', minWidth: 130 },
  { prop: 'status', label: '状态', width: 90, slot: 'status' },
];

const itemColumns: QfTableColumn<DictItem>[] = [
  { prop: 'itemLabel', label: '标签', minWidth: 140 },
  { prop: 'itemValue', label: '值', minWidth: 120 },
  { prop: 'sortOrder', label: '排序', width: 90 },
  { prop: 'status', label: '状态', width: 110, slot: 'status' },
];

const submitting = ref(false);
const typeDialogVisible = ref(false);
const itemDialogVisible = ref(false);
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

const typeRules: FormRules<DictTypeCommand> = {
  dictCode: [{ required: true, message: '请输入编码', trigger: 'blur' }],
  dictName: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
};

const itemRules: FormRules<DictItemCommand> = {
  dictCode: [{ required: true, message: '请输入字典编码', trigger: 'blur' }],
  itemLabel: [{ required: true, message: '请输入标签', trigger: 'blur' }],
  itemValue: [{ required: true, message: '请输入值', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
};

const typeQuery = reactive({
  keyword: '',
  status: '',
});

const itemQuery = reactive({
  keyword: '',
  status: '',
});

const typeTable = useTable<DictType>({
  fetcher: () => systemApi.dictTypes(),
  autoLoad: true,
});

const itemTable = useTable<DictItem, { dictCode: string }>({
  fetcher: (filters) => systemApi.dictItems(filters.dictCode),
  defaultFilters: { dictCode: '' },
  autoLoad: false,
});

const filteredTypeRows = computed(() => {
  const keyword = typeQuery.keyword.trim().toLowerCase();
  return typeTable.allRows.value.filter((row) => {
    const matchedKeyword =
      !keyword ||
      row.dictCode.toLowerCase().includes(keyword) ||
      row.dictName.toLowerCase().includes(keyword);
    const matchedStatus = !typeQuery.status || row.status === typeQuery.status;
    return matchedKeyword && matchedStatus;
  });
});

const filteredItemRows = computed(() => {
  const keyword = itemQuery.keyword.trim().toLowerCase();
  return itemTable.allRows.value.filter((row) => {
    const matchedKeyword =
      !keyword ||
      row.itemLabel.toLowerCase().includes(keyword) ||
      row.itemValue.toLowerCase().includes(keyword);
    const matchedStatus = !itemQuery.status || row.status === itemQuery.status;
    return matchedKeyword && matchedStatus;
  });
});

// Auto-select first type after initial load
watch(
  () => typeTable.allRows.value,
  (rows) => {
    if (!currentType.value && rows.length > 0) {
      selectType(rows[0]);
    }
  },
);

async function selectType(row: unknown) {
  const dictType = row as DictType | null;
  currentType.value = dictType;
  if (!dictType) {
    return;
  }
  itemTable.filters.dictCode = dictType.dictCode;
  await itemTable.reload();
}

async function searchDicts() {
  if (currentType.value) {
    await itemTable.reload();
  }
}

async function resetSearch() {
  Object.assign(typeQuery, { keyword: '', status: '' });
  Object.assign(itemQuery, { keyword: '', status: '' });
  if (currentType.value) {
    await itemTable.reload();
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

function openCurrentTypeEdit() {
  if (currentType.value) {
    openTypeEdit(currentType.value);
  }
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
    await typeTable.reload();
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
  await typeTable.reload();
}

async function deleteCurrentType() {
  if (currentType.value) {
    await deleteType(currentType.value);
  }
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
    await itemTable.reload();
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
  await itemTable.reload();
}
</script>

<style scoped>
.dict-page__filter {
  width: var(--qf-field-width-xl);
}

.dict-page__tables {
  display: grid;
  grid-template-columns: minmax(420px, 0.42fr) minmax(640px, 0.58fr);
  gap: var(--qf-spacing-lg);
  align-items: start;
}

@media (width <= 1200px) {
  .dict-page__tables {
    grid-template-columns: 1fr;
  }
}

@media (width <= 640px) {
  .dict-page__filter {
    width: 100%;
  }
}
</style>
