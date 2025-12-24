<script setup lang="ts">
import IconOpenApi from '@/components/icons/IconOpenApi.vue'
</script>

<template>
  <div class="flex flex-col h-full w-full p-6">
    <!-- 头部 -->
    <div class="flex items-center h-12">
      <a-avatar :size="32" class="bg-blue-600"><IconOpenApi /></a-avatar>
      <div class="ml-2 text-lg font-medium text-gray-700">开发API</div>
      <div class="ml-2 text-gray-500">利用开放 API 快速与企业现有业务对接</div>
    </div>
    <!-- 导航 -->
    <div class="h-10 flex items-center mt-2">
      <RouterLink
        :to="{ name: 'quick-start' }"
        :class="`px-4 py-2 rounded-lg ${$route.name === 'quick-start' ? 'bg-gray-300 ' : ''}`"
        >快速开始</RouterLink
      >
      <RouterLink
        :to="{ name: 'openapi-key' }"
        :class="`px-4 py-2 rounded-lg ${$route.name === 'openapi-key' ? 'bg-gray-300 ' : ''}`"
        >密钥</RouterLink
      >
    </div>
    <!-- 内容 -->
    <RouterView />
  </div>
</template>

<style scoped></style>
