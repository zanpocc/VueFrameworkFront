import { describe, it, expect, vi } from 'vitest';
import { nextTick } from 'vue';
import { useTable } from '../useTable';

// Mock vue's onMounted so it runs immediately in tests
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return {
    ...actual,
    onMounted: (fn: () => void) => fn(),
  };
});

describe('useTable', () => {
  it('throws if neither fetcher nor paginatedFetcher is provided', () => {
    expect(() => useTable()).toThrow('either fetcher or paginatedFetcher');
  });

  it('fetches data via fetcher on mount when autoLoad=true', async () => {
    const items = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ];
    const fetcher = vi.fn().mockResolvedValue(items);

    const table = useTable({ fetcher });
    // Wait for the async mount to complete
    await vi.waitFor(() => expect(table.loading.value).toBe(false));

    expect(fetcher).toHaveBeenCalledOnce();
    expect(table.total.value).toBe(2);
    expect(table.rows.value).toHaveLength(2);
  });

  it('fetches data via paginatedFetcher', async () => {
    const records = [{ id: 1 }];
    const paginatedFetcher = vi.fn().mockResolvedValue({ records, total: 50 });

    const table = useTable({ paginatedFetcher, autoLoad: true });
    await vi.waitFor(() => expect(table.loading.value).toBe(false));

    expect(paginatedFetcher).toHaveBeenCalledWith({
      page: 1,
      size: 20,
      filters: {},
    });
    expect(table.total.value).toBe(50);
    expect(table.rows.value).toEqual(records);
  });

  it('reload re-fetches with current filters', async () => {
    const fetcher = vi.fn().mockResolvedValue([{ id: 1 }]);
    const table = useTable({ fetcher, autoLoad: false });

    await table.reload();
    expect(fetcher).toHaveBeenCalledTimes(1);

    await table.reload();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('reset restores default filters and reloads from page 1', async () => {
    const fetcher = vi.fn().mockResolvedValue([]);
    const defaults = { keyword: 'test' };
    const table = useTable({ fetcher, autoLoad: false, defaultFilters: defaults });

    await table.reload();
    table.currentPage.value = 3;

    await table.reset();
    expect(table.currentPage.value).toBe(1);
    expect(table.filters).toEqual(defaults);
  });

  it('client-side pagination slices rows correctly', async () => {
    const items = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }));
    const fetcher = vi.fn().mockResolvedValue(items);

    const table = useTable<{ id: number }>({ fetcher, clientPageSize: 10 });
    await vi.waitFor(() => expect(table.loading.value).toBe(false));

    expect(table.total.value).toBe(50);
    expect(table.rows.value).toHaveLength(10);
    expect(table.rows.value[0]!.id).toBe(1);
    expect(table.totalPages.value).toBe(5);
  });

  it('exposes allRows with full dataset in fetcher mode', async () => {
    const items = Array.from({ length: 30 }, (_, i) => ({ id: i + 1 }));
    const fetcher = vi.fn().mockResolvedValue(items);

    const table = useTable<{ id: number }>({ fetcher, clientPageSize: 10 });
    await vi.waitFor(() => expect(table.loading.value).toBe(false));

    expect(table.allRows.value).toHaveLength(30);
    expect(table.rows.value).toHaveLength(10);
  });

  it('re-slices on page change without re-fetching', async () => {
    const items = Array.from({ length: 30 }, (_, i) => ({ id: i + 1 }));
    const fetcher = vi.fn().mockResolvedValue(items);

    const table = useTable<{ id: number }>({ fetcher, clientPageSize: 10 });
    await vi.waitFor(() => expect(table.loading.value).toBe(false));

    expect(fetcher).toHaveBeenCalledTimes(1);

    // Change page — should re-slice without re-fetching
    table.currentPage.value = 2;
    await nextTick();
    expect(table.rows.value).toHaveLength(10);
    expect(table.rows.value[0]!.id).toBe(11);
    expect(fetcher).toHaveBeenCalledTimes(1); // No additional fetch
  });
});
