import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDict } from '../useDict';

vi.mock('@/api/system', () => ({
  systemApi: {
    dictItems: vi.fn().mockResolvedValue([
      {
        id: 1,
        dictCode: 'status',
        itemLabel: '启用',
        itemValue: 'ENABLED',
        sortOrder: 1,
        status: 'ENABLED',
        remark: null,
      },
      {
        id: 2,
        dictCode: 'status',
        itemLabel: '禁用',
        itemValue: 'DISABLED',
        sortOrder: 2,
        status: 'ENABLED',
        remark: null,
      },
    ]),
  },
}));

describe('useDict', () => {
  beforeEach(() => {
    // Clear module-level cache between tests
    vi.clearAllMocks();
    // Reset the module-level cache by re-importing
    // Since the cache is module-level, we use the same instance
  });

  it('loadDict fetches and caches dict items', async () => {
    const { loadDict } = useDict();
    const items = await loadDict('status');
    expect(items).toHaveLength(2);
    expect(items[0].itemLabel).toBe('启用');
  });

  it('getItems returns cached items as computed', async () => {
    const { loadDict, getItems } = useDict();
    // The cache may already be populated from a previous test's loadDict call,
    // so we test with a code that hasn't been loaded yet.
    expect(getItems('nonexistent').value).toEqual([]);

    await loadDict('status');
    expect(getItems('status').value).toHaveLength(2);
  });

  it('getLabel resolves value to label', async () => {
    const { loadDict, getLabel } = useDict();
    await loadDict('status');
    expect(getLabel('status', 'ENABLED')).toBe('启用');
    expect(getLabel('status', 'DISABLED')).toBe('禁用');
  });

  it('getLabel returns value itself when dict not loaded or item not found', () => {
    const { getLabel } = useDict();
    expect(getLabel('unknown', 'X')).toBe('X');
  });
});
