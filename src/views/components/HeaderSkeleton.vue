<script setup lang="ts">
defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <a-skeleton :loading :animation="true">
    <div class="flex items-center gap-3">
      <a-skeleton-shape class="w-[40px] h-[40px] rounded-lg" />
      <div class="flex flex-col justify-between h-[40px]">
        <a-skeleton-line :widths="['260px']" />
        <div class="flex items-center gap-2">
          <a-skeleton-line :rows="1" :widths="['80px']" :line-height="14" />
          <a-skeleton-line :rows="1" :widths="['100px']" :line-height="14" />
          <a-skeleton-line :rows="1" :widths="['120px']" :line-height="14" />
        </div>
      </div>
    </div>
  </a-skeleton>
</template>

<style scoped></style>
