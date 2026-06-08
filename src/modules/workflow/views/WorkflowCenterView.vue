<template>
  <section class="page">
    <header class="page__header">
      <div>
        <h1>工作流</h1>
        <p>维护动态表单、流程定义、发起流程并处理待办。</p>
      </div>
      <el-button type="primary" @click="loadAll"> 刷新 </el-button>
    </header>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="表单设计" name="forms">
        <div class="workflow-toolbar">
          <el-button v-permission="'workflow:form:update'" type="primary" @click="createForm">
            新建表单
          </el-button>
        </div>
        <el-table :data="forms" border row-key="id">
          <el-table-column prop="formName" label="表单名称" min-width="160" />
          <el-table-column prop="formKey" label="编码" min-width="160" />
          <el-table-column prop="version" label="版本" width="90" />
          <el-table-column prop="status" label="状态" width="120" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="流程定义" name="definitions">
        <div class="workflow-toolbar">
          <el-button
            v-permission="'workflow:definition:update'"
            type="primary"
            :disabled="forms.length === 0"
            @click="createDefinition"
          >
            新建定义
          </el-button>
        </div>
        <el-table :data="definitions" border row-key="id">
          <el-table-column prop="processName" label="流程名称" min-width="160" />
          <el-table-column prop="processKey" label="编码" min-width="160" />
          <el-table-column prop="formName" label="表单" min-width="140" />
          <el-table-column prop="assigneeValue" label="审批人" width="120" />
          <el-table-column prop="status" label="状态" width="120" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="待办任务" name="tasks">
        <el-table :data="tasks" border row-key="id">
          <el-table-column prop="processTitle" label="标题" min-width="180" />
          <el-table-column prop="taskName" label="任务" width="120" />
          <el-table-column prop="assignee" label="处理人" width="120" />
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button
                v-permission="'workflow:task:update'"
                text
                type="primary"
                @click="approve(row)"
              >
                同意
              </el-button>
              <el-button
                v-permission="'workflow:task:update'"
                text
                type="danger"
                @click="reject(row)"
              >
                拒绝
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="流程实例" name="instances">
        <div class="workflow-toolbar">
          <el-button
            v-permission="'workflow:instance:start'"
            type="primary"
            :disabled="definitions.length === 0"
            @click="startProcess"
          >
            发起流程
          </el-button>
        </div>
        <el-table :data="instances" border row-key="id">
          <el-table-column prop="title" label="标题" min-width="180" />
          <el-table-column prop="initiator" label="发起人" width="120" />
          <el-table-column prop="status" label="状态" width="120" />
          <el-table-column prop="currentAssignee" label="当前处理人" width="130" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button text type="primary" @click="openHistory(row)"> 历史 </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="historyVisible" title="审批历史" width="680px">
      <el-table :data="historyRows" border row-key="id">
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column prop="action" label="动作" width="120" />
        <el-table-column prop="comment" label="意见" min-width="180" />
      </el-table>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  workflowApi,
  type FormDefinition,
  type ProcessDefinition,
  type ProcessInstance,
  type WorkflowHistory,
  type WorkflowTask,
} from '@/api/workflow';

const activeTab = ref('forms');
const forms = ref<FormDefinition[]>([]);
const definitions = ref<ProcessDefinition[]>([]);
const instances = ref<ProcessInstance[]>([]);
const tasks = ref<WorkflowTask[]>([]);
const historyRows = ref<WorkflowHistory[]>([]);
const historyVisible = ref(false);

async function loadAll() {
  const [formRows, definitionRows, instanceRows, taskRows] = await Promise.all([
    workflowApi.forms(),
    workflowApi.definitions(),
    workflowApi.instances(),
    workflowApi.todoTasks(),
  ]);
  forms.value = formRows;
  definitions.value = definitionRows;
  instances.value = instanceRows;
  tasks.value = taskRows;
}

async function createForm() {
  await workflowApi.createForm({
    formKey: `leave_form_${Date.now()}`,
    formName: '请假表单',
    schemaJson: '{"fields":[{"name":"days","label":"天数","type":"number"}]}',
    status: 'PUBLISHED',
  });
  ElMessage.success('表单已创建');
  await loadAll();
}

async function createDefinition() {
  await workflowApi.createDefinition({
    processKey: `leave_${Date.now()}`,
    processName: '请假审批',
    formId: forms.value[0].id,
    status: 'PUBLISHED',
    assigneeType: 'USER',
    assigneeValue: 'admin',
  });
  ElMessage.success('流程定义已创建');
  await loadAll();
}

async function startProcess() {
  await workflowApi.startProcess({
    processKey: definitions.value[0].processKey,
    title: '年假申请',
    businessKey: `leave-${Date.now()}`,
    formData: '{"days":3}',
  });
  ElMessage.success('流程已发起');
  activeTab.value = 'tasks';
  await loadAll();
}

async function approve(row: WorkflowTask) {
  await workflowApi.completeTask(row.id, { action: 'APPROVE', comment: '同意' });
  ElMessage.success('已同意');
  await loadAll();
}

async function reject(row: WorkflowTask) {
  await workflowApi.completeTask(row.id, { action: 'REJECT', comment: '拒绝' });
  ElMessage.success('已拒绝');
  await loadAll();
}

async function openHistory(row: ProcessInstance) {
  historyRows.value = await workflowApi.history(row.id);
  historyVisible.value = true;
}

onMounted(loadAll);
</script>

<style scoped>
.workflow-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}
</style>
