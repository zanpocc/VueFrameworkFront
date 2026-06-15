import { ElMessageBox } from 'element-plus';

/**
 * 共享确认删除 composable：包装 ElMessageBox.confirm，统一中文提示。
 *
 * 用法：
 * ```ts
 * const { confirmDelete } = useConfirmDelete();
 * await confirmDelete('用户张三');
 * // 用户确认后继续删除逻辑
 * ```
 */
export interface UseConfirmDeleteReturn {
  /** 弹出确认删除对话框。用户确认 resolve，取消 reject。 */
  confirmDelete: (name: string, type?: string) => Promise<void>;
}

export function useConfirmDelete(): UseConfirmDeleteReturn {
  async function confirmDelete(name: string, type = '记录'): Promise<void> {
    await ElMessageBox.confirm(`确定要删除${type}"${name}"吗？此操作不可恢复。`, '确认删除', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
  }

  return { confirmDelete };
}
