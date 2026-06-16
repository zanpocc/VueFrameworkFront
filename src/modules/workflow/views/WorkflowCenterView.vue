<template>
  <section class="page">
    <header class="page__header">
      <div>
        <h1>工作流</h1>
        <p>维护动态表单、流程定义、发起流程并处理待办。</p>
      </div>
    </header>

    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="待办任务" name="todo" lazy>
        <TodoTaskListView />
      </el-tab-pane>
      <el-tab-pane label="已办任务" name="done" lazy>
        <DoneTaskListView />
      </el-tab-pane>
      <el-tab-pane label="流程实例" name="instances" lazy>
        <InstanceListView />
      </el-tab-pane>
      <el-tab-pane label="表单设计" name="forms" lazy>
        <FormListView />
      </el-tab-pane>
      <el-tab-pane label="流程定义" name="definitions" lazy>
        <DefinitionListView />
      </el-tab-pane>
      <el-tab-pane label="抄送我的" name="cc" lazy>
        <CCListView />
      </el-tab-pane>
    </el-tabs>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TodoTaskListView from './TodoTaskListView.vue';
import DoneTaskListView from './DoneTaskListView.vue';
import InstanceListView from './InstanceListView.vue';
import FormListView from './FormListView.vue';
import DefinitionListView from './DefinitionListView.vue';
import CCListView from './CCListView.vue';

defineOptions({ name: 'WorkflowCenter' });

const activeTab = ref('todo');
</script>
