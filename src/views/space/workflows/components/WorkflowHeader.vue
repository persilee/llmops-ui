<script setup lang="ts">
import WorkFlowApi from '@/services/api/workflow'
import { formatDate } from '@/utils/format-util'
import HeaderSkeleton from '@/views/components/HeaderSkeleton.vue'
import { Message, Modal } from '@arco-design/web-vue'
import { isEqual } from 'lodash-es'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useSpaceStore } from '../../SpaceView.store'
import { useWorkflowStore } from '../Workflow.store'

// 定义组件的props类型
const props = defineProps<{
  headerLoading: boolean // 头部加载状态
}>()
// 定义组件的事件
const emits = defineEmits(['updateWorkflow']) // 更新工作流事件
const store = useWorkflowStore() // 工作流状态管理
const publishLoading = ref(false) // 发布操作的加载状态
const isPublished = computed(() => store.workflow?.status == 'published') // 工作流是否已发布
const spaceStore = useSpaceStore() // 空间状态管理
const isWorkflowChanged = ref(false) // 工作流是否发生变更

// 处理更新工作流的函数
const handleUpdateWorkflow = () => {
  spaceStore.openEditWorkflowModal() // 打开编辑工作流的模态框
}

/**
 * 处理发布工作流的操作
 * @async
 * @description 当用户点击发布按钮时调用此函数
 * 1. 检查工作流是否通过调试
 * 2. 如果未通过调试，显示确认对话框
 * 3. 用户确认后执行发布操作
 * 4. 处理发布过程中的加载状态和错误
 */
const handlePublishClick = async () => {
  // 检查工作流是否通过调试
  if (!store.workflow?.is_debug_passed) {
    // 显示确认对话框，提示用户工作流未通过调试
    Modal.info({
      title: '发布前未调试通过',
      content: '发布前未进行调试,建议确保工作流程正常运行后再发布。',
      titleAlign: 'start', // 标题左对齐显示
      hideCancel: false, // 显示取消按钮，允许用户取消操作
      simple: false, // 使用完整模式显示对话框
      okText: '坚持发布', // 确认按钮文本
      // 用户确认发布后的回调函数
      onOk: async () => {
        try {
          // 检查工作流数据是否存在
          if (store.workflow && store.workflow.id) {
            // 设置加载状态为true，显示加载动画
            publishLoading.value = true
            // 调用API发布工作流
            const resp = await WorkFlowApi.publishWorkflow(store.workflow?.id)
            // 重新获取工作流数据以更新状态
            await store.getWorkflow(store.workflow?.id)
            // 显示操作成功的提示消息
            Message.success(resp.message)
          }
        } catch (error) {
          // 捕获并处理可能发生的错误
        } finally {
          // 无论成功失败，最后都要重置加载状态
          publishLoading.value = false
        }
      },
    })
  }
}

/**
 * 处理取消发布工作流的操作
 * @async
 * @description 当用户点击取消发布按钮时调用此函数
 * 1. 检查工作流是否存在
 * 2. 设置加载状态
 * 3. 调用API取消发布
 * 4. 刷新工作流数据
 * 5. 显示成功消息
 * 6. 处理错误情况
 * 7. 重置加载状态
 */
const handleCancelPublishClick = async () => {
  try {
    // 检查工作流数据是否存在
    if (store.workflow && store.workflow.id) {
      // 设置加载状态为true，显示加载动画
      publishLoading.value = true
      // 调用API取消发布工作流
      const resp = await WorkFlowApi.cancelPublishWorkflow(store.workflow?.id)
      // 重新获取工作流数据以更新状态
      await store.getWorkflow(store.workflow?.id)
      // 显示操作成功的提示消息
      Message.success(resp.message)
    }
  } catch (error) {
    // 捕获并处理可能发生的错误
  } finally {
    // 无论成功失败，最后都要重置加载状态
    publishLoading.value = false
  }
}

// 监听工作流图形的变化，用于检测是否有未发布的修改
const stop = watch(
  // 监听store中的workflow.graph的变化
  () => store.workflow?.graph,
  // 当图形发生变化时的回调函数
  (newVal) => {
    // 使用isEqual比较新值和草稿图形是否相同
    // 如果不同，说明有未发布的修改，将isWorkflowChanged设为true
    isWorkflowChanged.value = !isEqual(newVal, store.workflow?.draft_graph)
  },
)

// 组件卸载时清理watch监听器，防止内存泄漏
onUnmounted(() => {
  stop()
})
</script>

<template>
  <!-- 顶部导航 -->
  <header
    class="h-[66px] bg-gray-50 p-4 flex items-center justify-between border-b border-gray-100 shadow-sm relative"
  >
    <!-- 左边标题和返回按钮 -->
    <div class="flex-1 flex items-center gap-2">
      <!-- 返回按钮 -->
      <RouterLink :to="{ name: 'space-workflows' }" replace>
        <a-button class="bg-gray-100 hover:bg-gray-200">
          <template #icon><icon-left /></template>
        </a-button>
      </RouterLink>
      <!-- 图标、标题和信息 -->
      <HeaderSkeleton v-if="headerLoading" />
      <div v-else class="flex items-center gap-3">
        <!-- 图标 -->
        <div class="bg-white border border-gray-300 rounded-lg p-2">
          <img :src="store.workflow?.icon" class="w-[25px] h-[28px]" />
        </div>
        <!-- 标题和信息 -->
        <div class="flex flex-col justify-between">
          <div class="flex items-center">
            <div class="text-gray-700 font-bold">{{ store.workflow?.name }}</div>
            <a-tooltip :content="store.workflow?.description">
              <icon-info-circle class="w-3.5 h-3.5 text-gray-500 ml-1.5" />
            </a-tooltip>
            <a-tooltip v-if="isPublished" :content="'已发布'">
              <div
                class="bg-green-500 rounded-full w-3 h-3 flex items-center justify-center ml-1.5"
              >
                <icon-check class="w-2 h-2 text-white" />
              </div>
            </a-tooltip>
            <a-tooltip content="编辑">
              <a-button type="text" size="mini" @click="handleUpdateWorkflow">
                <template #icon>
                  <img src="@/assets/images/icon-edit.png" class="w-3 h-3" />
                </template>
              </a-button>
            </a-tooltip>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <a-tag size="small" class="rounded h-[16px] leading-[16px] bg-gray-200 text-[10px]">
              <div v-if="store.loading" class="flex items-center gap-1.5">
                <a-spin :loading="store.loading" :size="12" class="loading" />
                <div class="text-gray-500">保存中...</div>
              </div>
              <div v-else class="text-gray-500">
                自动保存于
                {{ formatDate(store.workflow?.updated_at, 'HH:mm:ss') }}
              </div>
            </a-tag>
            <a-tag
              v-if="isWorkflowChanged"
              size="small"
              class="rounded h-[16px] leading-[16px] bg-gray-200 text-gray-500 text-[10px]"
            >
              有尚未发布的修改
            </a-tag>
          </div>
        </div>
      </div>
    </div>
    <!-- 右边按钮 -->
    <div class="flex-1 flex items-center justify-end gap-4">
      <a-tooltip
        :disabled="isWorkflowChanged"
        content="工作流没有被修改，无需二次发布"
        position="br"
      >
        <a-button-group :disabled="!isWorkflowChanged">
          <a-button
            :loading="publishLoading"
            type="primary"
            class="rounded-l-sm font-bold"
            @click="handlePublishClick"
          >
            {{ isPublished ? '更新发布' : '发布' }}
          </a-button>
          <a-dropdown position="br">
            <a-button type="primary" class="w-6 rounded-r-sm" :disabled="publishLoading">
              <template #icon>
                <icon-down />
              </template>
            </a-button>
            <template #content>
              <a-doption
                :disabled="!isPublished"
                :class="`${!isPublished ? 'text-gray-400' : 'text-red-700'}`"
                @click="handleCancelPublishClick"
                >取消发布</a-doption
              >
            </template>
          </a-dropdown>
        </a-button-group>
      </a-tooltip>
    </div>
  </header>
</template>

<style scoped></style>
