<script setup lang="ts">
import AppsApi from '@/services/api/apps'
import { Message } from '@arco-design/web-vue'
import { onMounted, ref } from 'vue'
import { useAppStore } from '../../AppView.store'

// 定义模态框的显示状态，使用defineModel创建双向绑定的响应式变量
const visible = defineModel('visible', { type: Boolean, default: false })
// 定义加载状态，用于控制数据获取时的loading效果
const loading = ref(false)
// 定义更新加载状态，用于控制数据更新时的loading效果
const updateLoading = ref(false)
// 初始化应用状态管理store
const store = useAppStore()
// 定义summary的响应式引用，用于存储对话摘要内容
const summary = ref<string>('')

// 处理关闭模态框的方法
const handleCloseModal = () => {
  visible.value = false
}

/**
 * 获取对话摘要信息
 * @description 从服务器获取当前应用的对话摘要内容，并更新到 summary 响应式变量中
 * @returns {Promise<void>} 无返回值的 Promise
 * @throws {Error} 当 API 调用失败时抛出错误
 */
const fetchSummary = async () => {
  try {
    // 检查应用信息是否存在
    if (store.app && store.app.id && store.draftAppConfig.long_term_memory.enable) {
      // 设置加载状态
      loading.value = true
      // 调用 API 获取对话摘要
      const resp = await AppsApi.getDebugConversationSummary(store.app.id)
      // 更新摘要内容到响应式变量
      summary.value = resp.data.summary
    }
  } catch (error) {
    // 错误处理
  } finally {
    // 无论成功失败都重置加载状态
    loading.value = false
  }
}

/**
 * 更新对话摘要信息
 * @description 将编辑后的对话摘要内容提交到服务器进行更新
 * @returns {Promise<void>} 无返回值的 Promise
 * @throws {Error} 当 API 调用失败时抛出错误
 */
const updateSummary = async () => {
  try {
    // 检查应用信息是否存在
    if (store.app && store.app.id) {
      // 设置更新加载状态
      updateLoading.value = true
      // 调用 API 更新对话摘要
      const resp = await AppsApi.updateDebugConversationSummary(store.app.id, {
        summary: summary.value,
      })
      // 关闭模态框
      handleCloseModal()
      // 显示成功提示信息
      Message.success(resp.message)
    }
  } catch (error) {
    // 错误处理
  } finally {
    // 无论成功失败都重置加载状态
    updateLoading.value = false
  }
}

// 组件挂载时自动获取对话摘要
onMounted(() => {
  fetchSummary()
})
</script>

<template>
  <a-modal
    :visible="visible"
    :width="600"
    title="长期记忆"
    title-align="start"
    :footer="false"
    modal-class="rounded-xl"
    @cancel="handleCloseModal"
  >
    <a-spin :loading="loading" class="h-full w-full">
      <div v-if="summary" class="">
        <!-- 文本框 -->
        <a-textarea
          v-model="summary"
          class="h-full flex-1 py-1.5 bg-gray-100 rounded-xl focus-within:border-blue-700 border border-gray-400"
          :max-length="2000"
          :auto-size="{ minRows: 8, maxRows: 8 }"
          show-word-limit
        >
        </a-textarea>
        <!-- 底部按钮 -->
        <div class="flex justify-end mt-4">
          <a-button
            type="outline"
            class="border-gray-300 text-gray-500 mr-3"
            @click="handleCloseModal"
            >取消</a-button
          >
          <a-button
            :loading="updateLoading"
            type="primary"
            class=""
            html-type="submit"
            @click="updateSummary"
            >更新记忆</a-button
          >
        </div>
      </div>
      <a-empty v-else>暂无长期记忆</a-empty>
    </a-spin>
  </a-modal>
</template>

<style scoped></style>
