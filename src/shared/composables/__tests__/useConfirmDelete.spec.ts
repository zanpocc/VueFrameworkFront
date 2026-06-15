import { describe, it, expect, vi } from 'vitest';
import { useConfirmDelete } from '../useConfirmDelete';

vi.mock('element-plus', () => ({
  ElMessageBox: {
    confirm: vi.fn().mockResolvedValue('confirm'),
  },
}));

describe('useConfirmDelete', () => {
  it('confirmDelete calls ElMessageBox.confirm with Chinese text', async () => {
    const { ElMessageBox } = await import('element-plus');
    const { confirmDelete } = useConfirmDelete();

    await confirmDelete('测试记录');

    expect(ElMessageBox.confirm).toHaveBeenCalledWith(
      '确定要删除记录"测试记录"吗？此操作不可恢复。',
      '确认删除',
      expect.objectContaining({
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }),
    );
  });

  it('confirmDelete uses custom type when provided', async () => {
    const { ElMessageBox } = await import('element-plus');
    (ElMessageBox.confirm as ReturnType<typeof vi.fn>).mockClear();

    const { confirmDelete } = useConfirmDelete();
    await confirmDelete('用户A', '用户');

    expect(ElMessageBox.confirm).toHaveBeenCalledWith(
      '确定要删除用户"用户A"吗？此操作不可恢复。',
      '确认删除',
      expect.any(Object),
    );
  });
});
