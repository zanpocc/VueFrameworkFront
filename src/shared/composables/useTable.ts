import { computed, onMounted, reactive, ref, watch, type ComputedRef, type Ref } from 'vue';

/**
 * Options for the useTable composable.
 *
 * Supports two fetch modes:
 * 1. **Array mode** (current backend): provide `fetcher` that returns a full
 *    array. Client-side pagination is applied automatically.
 * 2. **Paginated mode** (future backend): provide `paginatedFetcher` that
 *    returns `{ records, total }`. Server-side pagination is used directly.
 */
export interface UseTableOptions<
  Row,
  Filters extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Fetcher that returns the full array (current backend pattern). */
  fetcher?: (filters: Filters) => Promise<Row[]>;
  /** Fetcher that returns a paginated result (future backend pattern). */
  paginatedFetcher?: (params: {
    page: number;
    size: number;
    filters: Filters;
  }) => Promise<{ records: Row[]; total: number }>;
  /** Default filter values. */
  defaultFilters?: Filters;
  /** Whether to load on mount. Default true. */
  autoLoad?: boolean;
  /** Client-side page size for array-return mode. Default 20. */
  clientPageSize?: number;
}

export interface UseTableReturn<
  Row,
  Filters extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Current page rows (sliced for client-side pagination when using fetcher). */
  rows: Ref<Row[]>;
  /** Full dataset in fetcher mode; same as rows in paginatedFetcher mode. */
  allRows: Ref<Row[]>;
  /** Whether a fetch is in progress. */
  loading: Ref<boolean>;
  /** Reactive filter object — v-model binds directly. */
  filters: Filters;
  /** Total row count. */
  total: Ref<number>;
  /** Current page number (1-based). */
  currentPage: Ref<number>;
  /** Page size. */
  pageSize: Ref<number>;
  /** Total number of pages. */
  totalPages: ComputedRef<number>;
  /** Re-fetch with current filters and page. */
  reload: () => Promise<void>;
  /** Reset filters to defaults and re-fetch from page 1. */
  reset: () => Promise<void>;
}

export function useTable<Row, Filters extends Record<string, unknown> = Record<string, unknown>>(
  options: UseTableOptions<Row, Filters> = {},
): UseTableReturn<Row, Filters> {
  const {
    fetcher,
    paginatedFetcher,
    defaultFilters = {} as Filters,
    autoLoad = true,
    clientPageSize = 20,
  } = options;

  if (!fetcher && !paginatedFetcher) {
    throw new Error('useTable: either fetcher or paginatedFetcher must be provided');
  }

  const allRows = ref<Row[]>([]) as Ref<Row[]>;
  const rows = ref<Row[]>([]) as Ref<Row[]>;
  const loading = ref(false);
  const filters = reactive({ ...defaultFilters }) as Filters;
  const total = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(clientPageSize);
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));

  async function reload(): Promise<void> {
    loading.value = true;
    try {
      if (paginatedFetcher) {
        const result = await paginatedFetcher({
          page: currentPage.value,
          size: pageSize.value,
          filters,
        });
        rows.value = result.records;
        total.value = result.total;
      } else if (fetcher) {
        const result = await fetcher(filters);
        allRows.value = result;
        total.value = result.length;
        sliceRows();
      }
    } finally {
      loading.value = false;
    }
  }

  async function reset(): Promise<void> {
    Object.assign(filters, { ...defaultFilters });
    currentPage.value = 1;
    await reload();
  }

  /** Slice allRows for client-side pagination. */
  function sliceRows() {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    rows.value = allRows.value.slice(start, end);
  }

  // Re-slice when page or size changes (only in array mode).
  // We use a watcher-like approach: when currentPage or pageSize changes
  // and we're in array mode, re-slice without re-fetching.
  // For simplicity, we expose a computed that reacts.
  // Actually, we just call sliceRows in the watcher setup:
  // Vue's reactivity will handle this via computed if needed.
  // But since rows is a ref we manually set, let's keep it simple:
  // the consumer calls reload() when they change page, or we auto-slice.

  // Auto-slice on page/size change for array mode.
  watch([currentPage, pageSize], () => {
    if (fetcher) {
      sliceRows();
    }
  });

  if (autoLoad) {
    onMounted(reload);
  }

  return {
    rows,
    allRows,
    loading,
    filters,
    total,
    currentPage,
    pageSize,
    totalPages,
    reload,
    reset,
  };
}
