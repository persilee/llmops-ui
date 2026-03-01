<script setup lang="ts">
import WorkFlowApi from '@/services/api/workflow'
import type { GetWorkflowsWithPage } from '@/services/api/workflow/types'
import type { Paginator } from '@/services/types'
import { formatDate } from '@/utils/format-util'
import LoadingStatus from '@/views/components/LoadingStatus.vue'
import { useAppStore } from '@/views/space/apps/AppView.store'
import { Message } from '@arco-design/web-vue'
import * as _ from 'lodash-es'
import { computed, onUnmounted, ref, useTemplateRef, watch } from 'vue'

const props = defineProps<{
  nodeWorkflows: any[]
}>()
const emits = defineEmits(['updateNodeWorkflows'])
const visible = defineModel('visible', { type: Boolean, default: false })
const loading = ref(false)
const store = useAppStore()
const scrollContainerRef = useTemplateRef('scrollContainer')
const loadMorLoading = ref(false)
const workflows = ref<any[]>([])
const selectedWorkflows = ref<any[]>([])
const paginator = ref<Paginator>({
  current_page: 1, // 当前页码
  page_size: 20, // 每页显示数量
  total_page: 0, // 总页数
  total_record: 0, // 总记录数
})

const handleClose = () => {
  visible.value = false
}

/**
 * 获取工作流数据
 * @param {boolean} [isLoadMore=false] - 是否为加载更多操作，默认为false
 * @returns {Promise<void>} 无返回值的Promise
 *
 * 功能说明：
 * 1. 支持分页加载和加载更多两种模式
 * 2. 在加载更多模式下，检查是否还有下一页数据
 * 3. 在重新加载模式下，重置页码并清空现有数据
 * 4. 调用API获取数据并更新工作流列表
 * 5. 处理加载状态和错误情况
 */
const fetchData = async (isLoadMore: boolean = false) => {
  // 处理分页逻辑
  if (isLoadMore) {
    // 如果是加载更多，检查是否还有下一页
    if (paginator.value.current_page >= paginator.value.total_page) return
    // 页码递增
    paginator.value.current_page++
  } else {
    // 如果是重新加载，重置页码并清空现有数据
    paginator.value.current_page = 1
    workflows.value = []
  }

  try {
    // 设置加载状态，显示加载动画
    loadMorLoading.value = true

    // 调用API获取工具数据
    const resp = await WorkFlowApi.getWorkflowsWithPage({
      current_page: paginator.value.current_page,
      page_size: paginator.value.page_size,
    })
    // 将新数据追加到现有列表中
    workflows.value.push(...resp.data.list.filter((item: any) => item.status == 'published'))
    // 更新分页信息
    paginator.value = resp.data.paginator
  } catch (err) {
    // 错误处理：显示错误消息
    const errorMessage = err instanceof Error ? err.message : '数据加载失败'
    Message.error(errorMessage)
  } finally {
    // 无论成功失败，都关闭加载状态
    loadMorLoading.value = false
  }
}

/**
 * 处理滚动事件，实现无限滚动加载功能
 * @param {Event} e - 滚动事件对象
 */
const handleScroll = (e: Event) => {
  // 将事件目标转换为HTMLElement类型，以便访问其滚动相关属性
  const target = e.target as HTMLElement

  // 检查是否滚动到接近底部（距离底部16px时触发）
  // target.scrollTop: 当前滚动位置
  // target.clientHeight: 可见区域高度
  // target.scrollHeight: 总内容高度
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 16) {
    // 如果正在加载中，则不重复触发加载
    if (loadMorLoading.value) return

    // 触发加载更多数据
    fetchData(true)
  }
}

/**
 * 保存工作流配置
 * 将用户选择的工作流配置保存到应用中
 */
const handleSave = async () => {
  emits('updateNodeWorkflows', selectedWorkflows.value)
  handleClose()
}

/**
 * 检查工作流是否已经被添加到草稿列表中
 * @param {GetDatasetsWithPage} dataset - 需要检查的工作流对象
 * @returns {boolean} 如果工作流已在草稿列表中返回true，否则返回false
 */
const isAdded = (workflow: GetWorkflowsWithPage) => {
  return selectedWorkflows.value.some((draftWorkflow: any) => draftWorkflow.id == workflow.id)
}

/**
 * 处理工作流的点击事件
 * @param {GetDatasetsWithPage} dataset - 被点击的工作流对象
 */
const handleClick = (workflow: GetWorkflowsWithPage) => {
  // 检查工作流是否已经被添加到草稿列表中
  if (isAdded(workflow)) {
    // 如果已添加，则从草稿列表中移除该工作流
    _.remove(selectedWorkflows.value, (draftWorkflow: any) => draftWorkflow.id == workflow.id)
  } else {
    // 如果未添加，则将工作流添加到草稿列表中
    selectedWorkflows.value.push({
      description: workflow.description, // 工作流描述
      icon: workflow.icon, // 工作流图标
      id: workflow.id, // 工作流ID
      name: workflow.name, // 工作流名称
    })
  }
}

// 判断是否需要显示手动加载按钮
const showLoadMoreBtn = computed(() => {
  if (!scrollContainerRef.value) return false
  const container = scrollContainerRef.value
  // 当内容高度小于容器高度时显示手动按钮
  return (
    container.scrollHeight <= container.clientHeight &&
    paginator.value.current_page < paginator.value.total_page
  )
})

/**
 * 监听抽屉显示状态的变化
 * 当抽屉打开时，初始化知识库列表和草稿数据
 */
const stop = watch(visible, async (val) => {
  if (val) {
    // 获取知识库列表数据
    await fetchData()
    // 深拷贝知识库列表到selectedDatasets
    selectedWorkflows.value = _.cloneDeep(props.nodeWorkflows)
  }
})

onUnmounted(() => {
  stop()
})
</script>

<template>
  <a-modal
    :visible="visible"
    :width="460"
    :title="'选择引用工作流'"
    title-align="start"
    :footer="false"
    modal-class="rounded-xl"
    body-class="pt-3"
    @cancel="handleClose"
  >
    <a-spin :loading="loading" class="w-full h-full">
      <div class="flex flex-col bg-white w-full h-full relative">
        <div
          ref="scrollContainer"
          class="flex flex-col gap-1.5 max-h-[660px] overflow-y-scroll scrollbar-w-none"
          @scroll="handleScroll"
        >
          <div
            v-for="workflow in workflows"
            :key="workflow.id"
            :class="`${isAdded(workflow) ? 'bg-blue-50 border border-blue-600' : 'border border-gray-100'} flex items-center gap-2  p-2 rounded-lg cursor-pointer hover:bg-blue-50`"
            @click="handleClick(workflow)"
          >
            <img :src="workflow.icon" class="w-10 h-10 rounded-lg bg-white flex-shrink-0" />
            <div class="flex-1 flex flex-col min-w-0">
              <div class="text-gray-600 font-bold">{{ workflow.name }}</div>
              <div class="text-gray-600 text-xs mt-0.5 line-clamp-1 overflow-ellipsis">
                {{ workflow.description }}
              </div>
              <div class="flex gap-2 mt-1.5">
                <div class="text-xs text-gray-400">
                  创建时间 {{ formatDate(workflow.created_at, 'YYYY-MM-DD HH:mm') }}
                </div>
              </div>
            </div>
          </div>
          <!-- 加载和 loading -->
          <LoadingStatus
            :loading="loadMorLoading"
            :paginator="paginator"
            :has-data="workflows.length > 0"
            :show-load-more-btn="showLoadMoreBtn"
            @load-more="fetchData(true)"
          />
        </div>
        <!-- 底部按钮 -->
        <div class="flex items-center justify-between mt-4">
          <div class="text-gray-800 font-bold text-[15px]">
            {{ selectedWorkflows.length }} 个工作流被选中
          </div>
          <div>
            <a-button type="outline" class="border-gray-300 text-gray-500 mr-3" @click="handleClose"
              >取消</a-button
            >
            <a-button :loading="loading" type="primary" @click="handleSave">保存</a-button>
          </div>
        </div>
      </div>
    </a-spin>
  </a-modal>
</template>

<style scoped></style>
