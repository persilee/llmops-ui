<script setup lang="ts">
import IconSpace from '@/components/icons/IconSpace.vue'
import { useRoute } from 'vue-router'
import InputSearch from '../components/InputSearch.vue'
import PageHeader from '../components/PageHeader.vue'
import PageRouterLink from '../components/PageRouterLink.vue'
import { useSpaceStore } from './SpaceView.store'

// 获取当前路由信息
const route = useRoute()
// 初始化空间视图的状态管理store
const store = useSpaceStore()

/**
 * 根据当前路由名称获取对应的按钮文本
 * @returns {string} 返回对应路由的按钮文本，如果没有匹配的路由则返回空字符串
 */
const getButtonText = () => {
  // 定义路由名称与按钮文本的映射关系
  const buttonTextMap: Record<string, string> = {
    'space-apps': '创建AI应用', // AI应用页面的按钮文本
    'space-tools': '创建自定义插件', // 插件页面的按钮文本
    'space-workflows': '创建工作流', // 工作流页面的按钮文本
    'space-datasets': '创建知识库', // 知识库页面的按钮文本
  }
  // 根据当前路由名称返回对应的按钮文本，如果没有匹配则返回空字符串
  return buttonTextMap[route.name as string] || ''
}

/**
 * 处理创建按钮点击事件
 * 根据当前路由名称打开对应的创建模态框
 */
const handleClick = () => {
  // AI应用页面：打开创建应用模态框
  if ((route.name as string) == 'space-apps') {
    store.openCreateAppModal()
  }
  // 插件页面：打开创建工具模态框
  else if ((route.name as string) == 'space-tools') {
    store.openCreateToolModal()
  }
  // 工作流页面：暂未实现
  else if ((route.name as string) == 'space-workflows') {
  }
  // 知识库页面：打开创建知识库模态框
  else if ((route.name as string) == 'space-datasets') {
    store.openCreateDatasetModal()
  }
}

// 处理搜索功能，更新store中的搜索关键词
const handleSearch = (value: string) => {
  store.searchWord = value
}
</script>

<template>
  <div class="flex flex-col h-full w-full px-6 overflow-hidden">
    <div class="pt-6 sticky top-0 z-6">
      <!-- 页面的头部 -->
      <PageHeader title="个人空间" :button-text="getButtonText()" @on-button-click="handleClick()">
        <IconSpace />
      </PageHeader>
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
        <InputSearch
          :search-word="store.searchWord"
          placeholder="搜索知识库"
          @update:searchWord="handleSearch"
        />
      </div>
    </div>

    <!-- 页面内容 -->
    <RouterView />
  </div>
</template>

<style scoped></style>
