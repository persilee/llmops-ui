<script setup lang="ts">
import NotFound from '@/assets/images/not-found.png'
import { useRoute } from 'vue-router'

const route = useRoute()

const getErrorMessage = () => {
  const params = route.params as any
  if (route.query.path) {
    return params.path
  }
  return Array.isArray(params.pathMatch)
    ? params.pathMatch.join('/')
    : params.pathMatch || route.fullPath
}
</script>

<template>
  <div class="h-full flex flex-col items-center justify-center">
    <!-- 页面背景 -->
    <img :src="NotFound" alt="NotFound" class="w-[300px] mb-4" />
    <div class="text-base text-gray-700 font-semibold mb-2.5">该智能体已不存在</div>
    <div class="flex flex-col items-center justify-center text-gray-500 mb-6 text-xs gap-1">
      <div class="">页面不存在或者已失效</div>
      <div class="">请检查您输入的地址是否正确后重试</div>
      <div class="">错误路径： {{ getErrorMessage() }}</div>
    </div>
    <router-link :to="{ name: 'home-page' }">
      <a-button type="primary">前往首页</a-button>
    </router-link>
  </div>
</template>

<style scoped></style>
