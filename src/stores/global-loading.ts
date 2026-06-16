import { computed, ref } from 'vue';

const pendingRequests = ref(0);

export const globalLoading = {
  loading: computed(() => pendingRequests.value > 0),
  start() {
    pendingRequests.value += 1;
  },
  finish() {
    pendingRequests.value = Math.max(0, pendingRequests.value - 1);
  },
  reset() {
    pendingRequests.value = 0;
  },
};
