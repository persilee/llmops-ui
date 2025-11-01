<script setup lang="ts">
defineProps<{
  title: string
  buttonText: string
}>()
</script>

<template>
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-2">
      <a-avatar :size="32" class="bg-blue-700!">
        <icon-common :size="18" />
      </a-avatar>
      <div class="text-xl font-medium text-gray-900">{{ title }}</div>
    </div>
    <a-button
      type="primary"
      class="h-10 rounded-[10px] px-5 text-sm font-bold text-blue-700 bg-blue-100"
    >
      {{ buttonText }}
    </a-button>
  </div>
</template>

<style scoped></style>
