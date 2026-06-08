import type { Directive } from 'vue';
import { useAuthStore } from '@/stores/auth';

export const permissionDirective: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    const required = Array.isArray(binding.value) ? binding.value : [binding.value];
    const authStore = useAuthStore();
    const allowed = required.every((permission) => authStore.hasPermission(permission));

    if (!allowed) {
      el.remove();
    }
  },
};
