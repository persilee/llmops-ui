<script setup lang="ts">
import AppsApi from '@/services/api/apps'
import ChatPanel from '@/views/space/apps/components/ChatPanel.vue'
import { onMounted, ref } from 'vue'
import { useAppStore } from './AppView.store'
import AbilityPanel from './components/AbilityPanel.vue'
import PromptPanel from './components/PromptPanel.vue'

// 初始化应用状态管理store
const store = useAppStore()
// 定义加载状态，用于控制页面加载时的loading效果
const loading = ref(false)

/**
 * 获取应用的草稿配置
 * 从服务器获取当前应用的草稿配置信息并更新到store中
 */
const fetchDraftAppConfig = async () => {
  try {
    // 检查应用是否存在且包含有效ID
    if (store.app && store.app.id) {
      // 开始加载状态
      loading.value = true
      // 调用API获取草稿配置
      const resp = await AppsApi.getDraftAppConfig(store.app.id)
      // 将获取的配置数据存储到store中
      store.draftAppConfig = resp.data
    }
  } catch (error) {
    // 错误处理（可根据需要添加具体的错误处理逻辑）
  } finally {
    // 无论成功失败都关闭加载状态
    loading.value = false
  }
}

// 在组件挂载完成后执行
onMounted(() => {
  // 获取应用的草稿配置
  fetchDraftAppConfig()
})
</script>

<template>
  <a-spin :loading="loading" class="w-full h-full">
    <div class="min-h-screen w-full">
      <div class="flex flex-row h-[calc(100vh-74px)]">
        <!-- 左侧应用编排内容 -->
        <div class="flex flex-col w-2/3 bg-gray-50 h-full">
          <!-- 标题 -->
          <header
            class="flex items-center flex-shrink-0 h-16 border-b border-gray-200 px-7 text-xl text-gray-700"
          >
            应用编排
          </header>
          <!-- 主体内容 -->
          <div class="flex flex-row h-full">
            <!-- 人设与回复逻辑 -->
            <PromptPanel />
            <!-- 应用能力 -->
            <AbilityPanel />
          </div>
        </div>
        <!-- 右侧预览与调试 -->
        <ChatPanel />
      </div>
    </div>
  </a-spin>
</template>

<style scoped></style>
