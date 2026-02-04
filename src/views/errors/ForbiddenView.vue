<script setup lang="ts">
import Forbidden from '@/assets/images/forbidden.png'
</script>

<template>
  <div class="h-full flex flex-col items-center justify-center">
    <!-- 页面背景 -->
    <img :src="Forbidden" alt="NotFound" class="w-[300px] mb-6" />
    <div class="text-base text-gray-700 font-semibold mb-3">对不起，您暂无权限访问该页面！</div>
    <div class="flex flex-col items-center justify-center text-gray-500 mb-6 text-xs gap-1">
      <div class="">您可能没有访问该页面的权限</div>
      <div class="">页面可能已被禁用或不存在</div>
      <div class="error-path">
        错误路径：{{
          Array.isArray($route.params.pathMatch)
            ? $route.params.pathMatch.join('/')
            : $route.params.pathMatch || $route.fullPath
        }}
      </div>
    </div>
    <router-link :to="{ name: 'home-page' }">
      <a-button type="primary">前往首页</a-button>
    </router-link>
  </div>
</template>

<style scoped></style>
