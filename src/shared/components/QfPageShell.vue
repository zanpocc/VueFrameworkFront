<template>
  <section class="qf-page-shell">
    <slot />
  </section>
</template>

<style scoped>
.qf-page-shell {
  display: grid;
  gap: var(--qf-spacing-lg);
  min-width: 0;
}
</style>
