<script setup lang="ts">
import type { KpiItem } from "../types";

defineProps<{ items: KpiItem[] }>();

function getToneClass(tone: string) {
  return `tone-${tone}`;
}
</script>

<template>
  <section class="metric-grid" aria-label="关键指标">
    <article
      v-for="item in items"
      :key="item.label"
      class="metric-card"
      :class="getToneClass(item.tone)"
    >
      <span>{{ item.label }}</span>
      <strong class="metric-value">{{ item.value }}</strong>
      <small>{{ item.trend }}</small>
    </article>
  </section>
</template>

<style scoped>
.tone-primary .metric-value {
  color: #7d8f2d;
}

.tone-warm .metric-value {
  color: #b55239;
}

.tone-cool .metric-value {
  color: #3975b5;
}

.tone-neutral .metric-value {
  color: #6b7280;
}

.tone-danger .metric-value {
  color: #b55239;
}

.tone-danger {
  border-color: color-mix(in srgb, #b55239 40%, transparent) !important;
  background: color-mix(in srgb, #b55239 8%, #f6f5ee) !important;
}

.tone-success .metric-value {
  color: #529b73;
}

.tone-success {
  border-color: color-mix(in srgb, #529b73 40%, transparent) !important;
  background: color-mix(in srgb, #529b73 8%, #f6f5ee) !important;
}
</style>
