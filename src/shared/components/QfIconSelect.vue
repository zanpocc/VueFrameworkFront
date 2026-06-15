<template>
  <el-select
    :model-value="modelValue"
    clearable
    filterable
    placeholder="请选择图标"
    @update:model-value="(value: string) => emit('update:modelValue', value)"
  >
    <el-option v-for="icon in icons" :key="icon.name" :label="icon.name" :value="icon.name">
      <span class="qf-icon-option">
        <el-icon><component :is="icon.component" /></el-icon>
        <span>{{ icon.name }}</span>
      </span>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { ElIcon, ElOption, ElSelect } from 'element-plus';
import {
  Bell,
  Briefcase,
  Checked,
  Collection,
  Connection,
  Document,
  EditPen,
  Menu,
  Monitor,
  OfficeBuilding,
  Operation,
  Setting,
  Share,
  Tickets,
  Timer,
  Tools,
  User,
  UserFilled,
} from '@element-plus/icons-vue';

defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void;
}>();

const icons = [
  { name: 'Monitor', component: Monitor },
  { name: 'Setting', component: Setting },
  { name: 'User', component: User },
  { name: 'UserFilled', component: UserFilled },
  { name: 'OfficeBuilding', component: OfficeBuilding },
  { name: 'Briefcase', component: Briefcase },
  { name: 'Menu', component: Menu },
  { name: 'Tools', component: Tools },
  { name: 'Collection', component: Collection },
  { name: 'Document', component: Document },
  { name: 'Timer', component: Timer },
  { name: 'Connection', component: Connection },
  { name: 'Bell', component: Bell },
  { name: 'Share', component: Share },
  { name: 'EditPen', component: EditPen },
  { name: 'Tickets', component: Tickets },
  { name: 'Checked', component: Checked },
  { name: 'Operation', component: Operation },
];
</script>

<style scoped>
.qf-icon-option {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}
</style>
