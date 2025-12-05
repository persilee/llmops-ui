<script setup lang="ts">
import PageSider from '../components/PageSider.vue'
</script>

<template>
  <!-- 基础布局容器 -->
  <a-layout has-sider class="h-full">
    <!-- 侧边栏 -->
    <PageSider />
    <!-- 主内容区域 -->
    <a-layout-content class="bg-gray-50">
      <router-view></router-view>
    </a-layout-content>
  </a-layout>
</template>

<style scoped></style>
