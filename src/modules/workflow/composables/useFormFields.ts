import { ref, type Ref } from 'vue';
import { workflowApi } from '@/api/workflow';
import type { FormField, FormSchema } from '@/form-engine/types';

/**
 * Loads the field list of a workflow form definition, parsing the `schemaJson`
 * blob stored on the backend. Used by the transition condition editor (and node
 * editors) to offer field-aware visual condition authoring.
 *
 * @returns a reactive `fields` ref and a `load` function bound to a formId.
 */
export function useFormFields(): {
  fields: Ref<FormField[]>;
  load: (formId: number | null | undefined) => Promise<FormField[]>;
} {
  const fields = ref<FormField[]>([]);

  async function load(formId: number | null | undefined): Promise<FormField[]> {
    if (!formId) {
      fields.value = [];
      return [];
    }
    try {
      const all = await workflowApi.forms();
      const form = all.find((f) => f.id === formId);
      if (!form || !form.schemaJson) {
        fields.value = [];
        return [];
      }
      const schema = JSON.parse(form.schemaJson) as FormSchema;
      fields.value = Array.isArray(schema.fields) ? schema.fields : [];
      return fields.value;
    } catch {
      fields.value = [];
      return [];
    }
  }

  return { fields, load };
}
