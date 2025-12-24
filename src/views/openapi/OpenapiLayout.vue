<script setup lang="ts">
import IconOpenApi from '@/components/icons/IconOpenApi.vue'
import { useOpenapiStore } from './Openapi.store'

const store = useOpenapiStore()
</script>

<template>
  <div class="flex flex-col h-full w-full p-6">
    <!-- 头部 -->
    <div class="flex items-center mb-6 h-10">
      <a-avatar :size="32" class="bg-blue-700"><IconOpenApi class="text-4.5" /></a-avatar>
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
      <div v-if="$route.name === 'openapi-key'" class="ml-auto">
        <a-button type="primary" @click="store.visible = true">新增密钥</a-button>
      </div>
    </div>
    <!-- 内容 -->
    <RouterView />
  </div>
</template>

<style scoped></style>
