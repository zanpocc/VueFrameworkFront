import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';
import QfDataTable from '../QfDataTable.vue';
import type { QfTableColumn, QfTableLoaderResult } from '../QfDataTable.vue';

interface Row extends Record<string, unknown> {
  id: number;
  name: string;
}

function makeLoader(records: Row[]) {
  return vi.fn(
    async (): Promise<QfTableLoaderResult<Record<string, unknown>>> => ({
      records,
      total: records.length,
    }),
  );
}

const columns: QfTableColumn<Row>[] = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '名称', minWidth: 160 },
];

// 透传到松散的 Record<string, unknown> 列类型，让 mount 在 TS 严格模式下通过。
function mountTable(props: Record<string, unknown>, slots: Record<string, unknown> = {}) {
  return mount(QfDataTable as unknown as new () => unknown, {
    props,
    slots,
    global: { plugins: [ElementPlus] },
  });
}

describe('QfDataTable', () => {
  it('calls loader on mount and renders rows', async () => {
    const loader = makeLoader([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);

    const wrapper = mountTable({ columns, loader });

    await flushPromises();

    expect(loader).toHaveBeenCalledTimes(1);
    expect(loader).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, size: 20, filters: {} }),
    );
    expect(wrapper.text()).toContain('Alice');
    expect(wrapper.text()).toContain('Bob');
  });

  it('honours defaultFilters and pageSize props', async () => {
    const loader = makeLoader([]);

    mountTable({
      columns,
      loader,
      pageSize: 50,
      defaultFilters: { keyword: 'hello' },
    });

    await flushPromises();

    expect(loader).toHaveBeenCalledWith({
      page: 1,
      size: 50,
      filters: { keyword: 'hello' },
    });
  });

  it('refresh() resets to first page and re-invokes loader', async () => {
    const loader = makeLoader([{ id: 1, name: 'Row' }]);

    const wrapper = mountTable({ columns, loader });

    await flushPromises();
    expect(loader).toHaveBeenCalledTimes(1);

    const exposed = wrapper.vm as unknown as { refresh: () => Promise<void> };
    await exposed.refresh();
    await flushPromises();

    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('renders empty state slot when there is no data', async () => {
    const loader = makeLoader([]);

    const wrapper = mountTable(
      { columns, loader },
      {
        empty: '没有匹配记录',
      },
    );

    await flushPromises();

    expect(wrapper.text()).toContain('没有匹配记录');
  });

  it('emits row-click when a row is clicked', async () => {
    const loader = makeLoader([{ id: 7, name: 'Charlie' }]);

    const wrapper = mountTable({ columns, loader });

    await flushPromises();

    const firstRow = wrapper.find('.el-table__row');
    expect(firstRow.exists()).toBe(true);
    await firstRow.trigger('click');

    const events = wrapper.emitted('row-click');
    expect(events).toBeTruthy();
    expect((events?.[0] as unknown[])?.[0]).toMatchObject({ id: 7, name: 'Charlie' });
  });
});
