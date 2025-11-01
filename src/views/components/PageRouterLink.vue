<script setup lang="ts">
defineProps<{
  label: string
  to: string
  isSider?: boolean
}>()
</script>

<template>
  <RouterLink
    :to="to"
    :class="`flex items-center gap-2 h-8 leading-8 rounded-lg transition-all ${isSider ? 'px-2' : 'px-4'} text-gray-700 hover:text-gray-900 hover:bg-gray-200`"
    active-class="bg-gray-200 font-bold"
  >
    <slot name="icon"></slot>
    {{ label }}
  </RouterLink>
</template>

<style scoped></style>
