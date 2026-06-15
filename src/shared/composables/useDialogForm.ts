import { computed, reactive, ref, type ComputedRef, type Ref } from 'vue';
import { ElMessage } from 'element-plus';

/**
 * Options for the useDialogForm composable.
 *
 * Manages the open/close, form reset, editing-item tracking, and submit
 * pattern shared by every CRUD page's dialog or drawer.
 */
export interface UseDialogFormOptions<Form extends object> {
  /** Default form values (used for reset on openCreate). */
  defaults: Form | (() => Form);
  /** Submit handler — receives the form data and the editing item (null for create). */
  onSubmit: (form: Form, editingItem: unknown | null) => Promise<void>;
  /** Success message. If provided, shows ElMessage.success after submit. */
  successMessage?: string | ((isEdit: boolean) => string);
}

export interface UseDialogFormReturn<Form extends object> {
  /** Whether the dialog/drawer is visible. */
  visible: Ref<boolean>;
  /** Whether a submit is in progress. */
  submitting: Ref<boolean>;
  /** Reactive form object — v-model binds directly. */
  form: Form;
  /** The item being edited (null when creating). */
  editingItem: Ref<unknown | null>;
  /** Whether we are in edit mode (as opposed to create). */
  isEditing: ComputedRef<boolean>;
  /** Open dialog for creating a new item (resets form to defaults). */
  openCreate: () => void;
  /** Open dialog for editing an existing item. */
  openEdit: (item: unknown, formValues: Partial<Form>) => void;
  /** Submit the form. Handles loading state, success message, and closing. */
  submit: () => Promise<void>;
  /** Close the dialog without submitting. */
  cancel: () => void;
}

export function useDialogForm<Form extends object>(
  options: UseDialogFormOptions<Form>,
): UseDialogFormReturn<Form> {
  const { defaults, onSubmit, successMessage } = options;

  const visible = ref(false);
  const submitting = ref(false);
  const editingItem = ref<unknown | null>(null);
  const isEditing = computed(() => editingItem.value !== null);

  const resolvedDefaults = typeof defaults === 'function' ? defaults() : defaults;
  const form = reactive({ ...resolvedDefaults }) as Form;

  function openCreate(): void {
    editingItem.value = null;
    Object.assign(form, { ...resolvedDefaults });
    visible.value = true;
  }

  function openEdit(item: unknown, formValues: Partial<Form>): void {
    editingItem.value = item;
    Object.assign(form, { ...resolvedDefaults, ...formValues });
    visible.value = true;
  }

  async function submit(): Promise<void> {
    submitting.value = true;
    try {
      await onSubmit(form, editingItem.value);
      visible.value = false;
      if (successMessage) {
        const msg =
          typeof successMessage === 'function' ? successMessage(isEditing.value) : successMessage;
        ElMessage.success(msg);
      }
    } finally {
      submitting.value = false;
    }
  }

  function cancel(): void {
    visible.value = false;
  }

  return {
    visible,
    submitting,
    form,
    editingItem,
    isEditing,
    openCreate,
    openEdit,
    submit,
    cancel,
  };
}
