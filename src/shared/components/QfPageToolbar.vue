<template>
  <div class="qf-page-toolbar">
    <slot />
  </div>
</template>

<style scoped>
.qf-page-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--qf-spacing-sm);
  align-items: center;
  justify-content: flex-end;
}
</style>
