import { computed, type ComputedRef } from 'vue';
import { systemApi, type DictItem } from '@/api/system';

/**
 * Composable for loading and caching dictionary data.
 *
 * Uses a module-level cache so multiple components sharing the same
 * dictCode do not re-fetch.
 */

const dictCache = new Map<string, DictItem[]>();
const dictLoading = new Map<string, Promise<DictItem[]>>();

export interface UseDictReturn {
  /** Load dict items for a given dictCode. Cached after first load. */
  loadDict: (dictCode: string) => Promise<DictItem[]>;
  /** Get cached dict items for a dictCode. Returns empty array if not yet loaded. */
  getItems: (dictCode: string) => ComputedRef<DictItem[]>;
  /** Resolve a dict item value to its label. Returns the value itself if not found. */
  getLabel: (dictCode: string, value: string) => string;
}

export function useDict(): UseDictReturn {
  async function loadDict(dictCode: string): Promise<DictItem[]> {
    const cached = dictCache.get(dictCode);
    if (cached) return cached;

    // Deduplicate concurrent loads for the same dictCode.
    const inFlight = dictLoading.get(dictCode);
    if (inFlight) return inFlight;

    const promise = systemApi.dictItems(dictCode).then((items) => {
      dictCache.set(dictCode, items);
      dictLoading.delete(dictCode);
      return items;
    });
    dictLoading.set(dictCode, promise);
    return promise;
  }

  function getItems(dictCode: string): ComputedRef<DictItem[]> {
    return computed(() => dictCache.get(dictCode) ?? []);
  }

  function getLabel(dictCode: string, value: string): string {
    const items = dictCache.get(dictCode);
    if (!items) return value;
    const item = items.find((i) => i.itemValue === value);
    return item?.itemLabel ?? value;
  }

  return { loadDict, getItems, getLabel };
}
