<template>
  <div class="qf-data-table">
    <div v-if="$slots.filters" class="qf-data-table__filters">
      <slot name="filters" :filters="filters" :reload="reload" :reset="reset" />
    </div>

    <div class="qf-data-table__scroll">
      <el-table
        v-loading="effectiveLoading"
        :data="rows"
        border
        row-key="id"
        v-bind="tableAttrs"
        :style="tableStyle"
        @row-click="(row: unknown) => emit('row-click', row)"
      >
        <el-table-column v-if="$slots.expand" type="expand">
          <template #default="scope">
            <slot name="expand" v-bind="scope" />
          </template>
        </el-table-column>

        <el-table-column
          v-for="column in columns"
          :key="String(column.prop ?? column.label)"
          v-bind="column as any"
        >
          <template v-if="column.formatter || column.slot" #default="scope">
            <slot v-if="column.slot" :name="column.slot" v-bind="scope" />
            <template v-else-if="column.formatter">
              {{ column.formatter(scope.row, scope.column, scope.row[column.prop!], scope.$index) }}
            </template>
          </template>
        </el-table-column>

        <el-table-column v-if="$slots.actions" label="操作" :width="actionsWidth" fixed="right">
          <template #default="scope">
            <slot name="actions" v-bind="scope" />
          </template>
        </el-table-column>

        <template #empty>
          <slot name="empty">暂无数据</slot>
        </template>
      </el-table>
    </div>

    <div v-if="total > 0" class="qf-data-table__pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="currentSize"
        :total="total"
        :page-sizes="pageSizes"
        background
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="reload"
        @size-change="onSizeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElPagination, ElTable, ElTableColumn, vLoading } from 'element-plus';

/**
 * 列定义：与 el-table-column 的常见 prop 对齐。
 *
 * 设计取舍：保留 `any` 以承载 Element Plus 的 column 透传，
 * 业务侧使用时通过泛型 Row 约束 prop 字段即可。Row 默认放宽到 any，
 * 因为外部使用时通常按业务行类型声明数组，再传给只接受宽类型的 prop。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface QfTableColumn<Row = any> {
  prop?: Row extends Record<string, unknown> ? (keyof Row & string) | string : string;
  label?: string;
  width?: string | number;
  minWidth?: string | number;
  fixed?: boolean | 'left' | 'right';
  align?: 'left' | 'center' | 'right';
  showOverflowTooltip?: boolean;
  sortable?: boolean | 'custom';
  /** 自定义渲染槽位名称（在 columns 上声明后，外层通过 v-slot:xxx 实现）。 */
  slot?: string;
  /** 同 el-table-column formatter，仅在未指定 slot 时生效。 */
  formatter?: (row: Row, column: unknown, value: unknown, index: number) => string;
  // 其他 el-table-column 属性允许透传，保持松散类型，不污染公开 API
  [key: string]: unknown;
}

/** 加载器返回结构，与后端通用分页响应保持兼容。 */
export interface QfTableLoaderResult<Row> {
  records: Row[];
  total: number;
}

/** 加载器接受的查询参数。 */
export interface QfTableLoaderParams {
  page: number;
  size: number;
  filters: Record<string, unknown>;
}

const props = withDefaults(
  defineProps<{
    /** 列定义数组，按顺序渲染。 */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columns: QfTableColumn<any>[];
    /**
     * 数据加载器；组件负责合并分页和 filters 后调用。
     * 提供 data prop 时忽略 loader。
     */
    loader?: (params: QfTableLoaderParams) => Promise<QfTableLoaderResult<Record<string, unknown>>>;
    /**
     * 直接传入行数据（替代 loader），适用于页面自行 fetch 的场景。
     * 提供此 prop 时组件跳过 loader 调用，仅做客户端分页展示。
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any[];
    /** 外部 loading 状态覆盖，优先于内部 loading。 */
    loading?: boolean;
    /** 单页默认大小。默认为 20。 */
    pageSize?: number;
    /** 分页大小可选列表。 */
    pageSizes?: number[];
    /** 默认筛选条件，会作为 reactive filters 的初始值，并参与 reset。 */
    defaultFilters?: Record<string, unknown>;
    /** 操作列宽度，默认 200。 */
    actionsWidth?: string | number;
    /** 表格最小宽度。设置后外层出现横向滚动，适合字段多且有固定操作列的页面。 */
    minTableWidth?: string | number;
    /** 透传给 el-table 的额外属性。 */
    tableAttrs?: Record<string, unknown>;
    /** 组件挂载后是否自动加载（仅 loader 模式）。默认 true。 */
    autoLoad?: boolean;
  }>(),
  {
    loader: undefined,
    data: undefined,
    loading: undefined,
    pageSize: 20,
    pageSizes: () => [10, 20, 50, 100],
    defaultFilters: () => ({}),
    actionsWidth: 200,
    minTableWidth: undefined,
    tableAttrs: () => ({}),
    autoLoad: true,
  },
);

const emit = defineEmits<{
  /** 行点击事件（与 el-table 一致）。 */
  (event: 'row-click', row: unknown): void;
}>();

const internalLoading = ref(false);
const effectiveLoading = computed(() => props.loading ?? internalLoading.value);
const rows = ref<Record<string, unknown>[]>([]);
const total = ref(0);
const currentPage = ref(1);
const currentSize = ref(props.pageSize);
const pageSizes = computed(() => props.pageSizes);
const tableStyle = computed(() => {
  const style: Record<string, string> = { width: '100%' };
  if (props.minTableWidth !== undefined) {
    style.minWidth =
      typeof props.minTableWidth === 'number' ? `${props.minTableWidth}px` : props.minTableWidth;
  }
  return style;
});

const initialFilters = () => ({ ...props.defaultFilters });
const filters = reactive<Record<string, unknown>>(initialFilters());

/** Whether we are in "data prop" mode (client-side pagination only). */
const isDataMode = computed(() => props.data !== undefined);

/** Slice data prop rows for current page. */
function sliceDataProp() {
  if (!props.data) return;
  total.value = props.data.length;
  const start = (currentPage.value - 1) * currentSize.value;
  const end = start + currentSize.value;
  rows.value = props.data.slice(start, end);
}

// Watch data prop changes and re-slice
watch(
  () => props.data,
  () => {
    if (isDataMode.value) {
      currentPage.value = 1;
      sliceDataProp();
    }
  },
  { deep: true, immediate: true },
);

// Re-slice when page or size changes in data mode
watch([currentPage, currentSize], () => {
  if (isDataMode.value) {
    sliceDataProp();
  }
});

async function load() {
  if (isDataMode.value) {
    sliceDataProp();
    return;
  }
  if (!props.loader) return;
  internalLoading.value = true;
  try {
    const result = await props.loader({
      page: currentPage.value,
      size: currentSize.value,
      filters: { ...filters },
    });
    rows.value = result.records;
    total.value = result.total;
  } finally {
    internalLoading.value = false;
  }
}

/** 重新加载当前页。 */
function reload() {
  return load();
}

/** 重置筛选条件并回到第一页。 */
function reset() {
  Object.keys(filters).forEach((key) => delete filters[key]);
  Object.assign(filters, initialFilters());
  currentPage.value = 1;
  return load();
}

/** 显式跳到第一页并加载。 */
function refresh() {
  currentPage.value = 1;
  return load();
}

function onSizeChange() {
  currentPage.value = 1;
  void load();
}

onMounted(() => {
  if (props.autoLoad && !isDataMode.value) {
    void load();
  }
});

defineExpose({ refresh, reload, reset, filters });
</script>

<style scoped>
.qf-data-table {
  display: grid;
  gap: 12px;
}

.qf-data-table__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.qf-data-table__scroll {
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.qf-data-table__pagination {
  display: flex;
  justify-content: flex-end;
}
</style>
