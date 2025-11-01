<script setup lang="ts">
import { useRoute } from 'vue-router'
import InputSearch from '../components/InputSearch.vue'
import PageHeader from '../components/PageHeader.vue'
import PageRouterLink from '../components/PageRouterLink.vue'
import { useToolProviderStore } from './SpaceView.store'

const route = useRoute()
const store = useToolProviderStore()

const getButtonText = () => {
  const buttonTextMap: Record<string, string> = {
    'space-apps': '创建AI应用',
    'space-tools': '创建自定义插件',
    'space-workflows': '创建工作流',
    'space-datasets': '创建知识库',
  }
  return buttonTextMap[route.name as string] || ''
}

const handleSearch = (value: string) => {
  store.searchWord = value
}
</script>

<template>
  <div class="flex flex-col h-full w-full px-6 bg-gray-50 overflow-hidden">
    <div class="pt-6 sticky top-0 z-66 bg-gray-50">
      <!-- 页面的头部 -->
      <PageHeader title="个人空间" :button-text="getButtonText()" />
      <!-- 页面导航+搜索框 -->
      <div class="flex items-center justify-between mb-6">
        <!-- 导航 -->
        <div class="flex items-center gap-2">
          <PageRouterLink to="/space/apps" label="AI应用" />
          <PageRouterLink to="/space/tools" label="插件" />
          <PageRouterLink to="/space/workflows" label="工作流" />
          <PageRouterLink to="/space/datasets" label="知识库" />
        </div>
        <!-- 搜索框 -->
        <InputSearch placeholder="搜索知识库" @update:searchWord="handleSearch" />
      </div>
    </div>

    <!-- 页面内容 -->
    <RouterView />
  </div>
</template>

<style scoped></style>
