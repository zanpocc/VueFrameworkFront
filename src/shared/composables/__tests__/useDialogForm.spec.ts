import { describe, it, expect, vi } from 'vitest';
import { useDialogForm } from '../useDialogForm';

// Mock ElMessage
vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn() },
}));

describe('useDialogForm', () => {
  const defaults = { name: '', age: 0 };

  it('openCreate resets form and sets visible', () => {
    const onSubmit = vi.fn();
    const form = useDialogForm({ defaults, onSubmit });

    form.form.name = 'existing';
    form.openCreate();

    expect(form.visible.value).toBe(true);
    expect(form.editingItem.value).toBeNull();
    expect(form.isEditing.value).toBe(false);
    expect(form.form.name).toBe('');
    expect(form.form.age).toBe(0);
  });

  it('openEdit sets editingItem and populates form', () => {
    const onSubmit = vi.fn();
    const form = useDialogForm({ defaults, onSubmit });
    const item = { id: 1 };

    form.openEdit(item, { name: 'Test', age: 25 });

    expect(form.visible.value).toBe(true);
    expect(form.editingItem.value).toStrictEqual(item);
    expect(form.isEditing.value).toBe(true);
    expect(form.form.name).toBe('Test');
    expect(form.form.age).toBe(25);
  });

  it('submit calls onSubmit and closes dialog', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const form = useDialogForm({ defaults, onSubmit });
    form.openCreate();
    form.form.name = 'New';

    await form.submit();

    expect(onSubmit).toHaveBeenCalledWith(form.form, null);
    expect(form.visible.value).toBe(false);
  });

  it('submit shows success message when provided', async () => {
    const { ElMessage } = await import('element-plus');
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const form = useDialogForm({
      defaults,
      onSubmit,
      successMessage: (isEdit) => (isEdit ? 'Updated' : 'Created'),
    });

    form.openCreate();
    await form.submit();
    expect(ElMessage.success).toHaveBeenCalledWith('Created');

    form.openEdit({ id: 1 }, { name: 'X' });
    await form.submit();
    expect(ElMessage.success).toHaveBeenCalledWith('Updated');
  });

  it('cancel closes dialog without submitting', () => {
    const onSubmit = vi.fn();
    const form = useDialogForm({ defaults, onSubmit });
    form.openCreate();
    form.cancel();

    expect(form.visible.value).toBe(false);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
