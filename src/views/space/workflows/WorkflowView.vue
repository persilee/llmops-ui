<script setup lang="ts">
import WorkFlowApi from '@/services/api/workflow'
import type { GetWorkflowsWithPage } from '@/services/api/workflow/types'
import type { Paginator } from '@/services/types'
import { useAccountStore } from '@/stores/account'
import { formatDate } from '@/utils/format-util'
import LoadingStatus from '@/views/components/LoadingStatus.vue'
import PageCard from '@/views/components/PageCard.vue'
import { Message, Modal } from '@arco-design/web-vue'
import { debounce } from 'lodash-es'
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSpaceStore } from '../SpaceView.store'
import WorkflowModel from './components/WorkflowModel.vue'
import { useWorkflowStore } from './Workflow.store'

// 加载状态标志，用于控制数据加载时的UI反馈
const loading = ref(false)
// 工作流列表数据，存储从API获取的工作流信息
const workflows = ref<GetWorkflowsWithPage[]>([])
// 当前选中的工作流对象，用于编辑操作
const selectedWorkflow = ref<GetWorkflowsWithPage>()
// 空间状态管理store，处理空间相关的状态和操作
const store = useSpaceStore()
// 工作流状态管理store，处理工作流相关的状态和操作
const workflowStore = useWorkflowStore()
// 账户状态管理store，处理用户账户相关的状态和操作
const accountStore = useAccountStore()
// 分页器配置对象，包含当前页码、每页条数、总页数和总记录数
const paginator = ref<Paginator>({
  current_page: 1, // 当前页码
  page_size: 20, // 每页显示条数
  total_page: 0, // 总页数
  total_record: 0, // 总记录数
})
// 滚动容器的模板引用，用于实现无限滚动加载功能
const scrollContainerRef = useTemplateRef('scrollContainer')
// 路由对象，用于导航到其他页面
const router = useRouter()

/**
 * 获取工作流数据
 * @param {boolean} [isLoadMore=false] - 是否为加载更多数据的标志
 *   - true: 加载更多数据，页码递增
 *   - false: 重新加载数据，重置页码并清空现有数据
 * @returns {Promise<void>} 返回一个Promise，表示异步操作完成
 *
 * 该函数会：
 * 1. 处理分页逻辑（重置或递增页码）
 * 2. 调用API获取工作流数据
 * 3. 更新工作流列表和分页信息
 * 4. 处理加载状态和错误提示
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
    // 开启加载状态
    loading.value = true
    // 调用API获取数据
    const resp = await WorkFlowApi.getWorkflowsWithPage({
      current_page: paginator.value.current_page, // 当前页码
      page_size: paginator.value.page_size, // 每页显示条数
      search_word: store.searchWord, // 搜索关键词
    })

    // 将新数据追加到现有列表中
    workflows.value.push(...resp.data.list)
    // 更新分页信息
    paginator.value = resp.data.paginator
  } catch (err) {
    // 错误处理：显示错误提示信息
    const errorMessage = err instanceof Error ? err.message : '数据加载失败'
    Message.error(errorMessage)
  } finally {
    // 无论成功失败都关闭加载状态
    loading.value = false
  }
}

// 创建防抖函数，延迟300ms执行数据获取，避免频繁请求
const debouncedFetchData = debounce(fetchData, 300)

// 监听搜索词变化，当搜索词改变时触发数据重新加载
const stop = watch(
  () => store.searchWord,
  (newVal) => {
    if (newVal) {
      debouncedFetchData() // 使用防抖函数重新获取数据，传入true表示初始化加载
    } else {
      fetchData() // 直接获取数据，传入true表示初始化加载
    }
  },
)

/**
 * 处理操作成功后的回调函数
 * 当工作流编辑或删除等操作成功后，调用此函数重新获取工作流列表数据
 * @returns {Promise<void>} 返回一个Promise，表示异步操作完成
 */
const handleSuccess = async () => {
  await fetchData()
}

/**
 * 处理工作流操作选择
 * @param v - 操作类型，可选值为 'edit' 或 'delete'
 * @param workflow - 被操作的工作流对象
 */
const handleSelect = async (v: string, workflow: GetWorkflowsWithPage) => {
  // 处理编辑操作
  if (v == 'edit') {
    // 设置当前选中的工作流
    selectedWorkflow.value = workflow
    workflowStore.workflow = workflow
    // 打开编辑工作流的模态框
    store.openEditWorkflowModal()
  }
  // 处理删除操作
  if (v == 'delete') {
    // 显示警告确认对话框
    Modal.warning({
      title: '要删除该工作流吗？', // 模态框标题
      content:
        '删除工作流后，发布的WebApp、开放API以及关联的社交媒体平台均无法使用该工作流，如果需要暂停工作流，可使用取消发布功能。', // 提示内容
      hideCancel: false, // 显示取消按钮
      titleAlign: 'start', // 标题左对齐
      simple: false, // 简单模式
      modalClass: 'delete-modal',
      okText: '删除', // 确认按钮文本
      // 确认按钮的回调函数
      onOk: async () => {
        try {
          if (workflow.id) {
            // 开启加载状态
            loading.value = true
            // 调用删除工作流API
            const resp = await WorkFlowApi.deleteWorkflow(workflow.id)
            // 显示删除成功的提示信息
            Message.success(resp.message)
            // 重新获取工作流列表数据
            await fetchData()
          }
        } catch (error) {
          // 错误处理：显示错误提示信息
          const errorMessage = error instanceof Error ? error.message : '删除失败'
          Message.error(errorMessage)
        } finally {
          // 无论成功失败都关闭加载状态
          loading.value = false
        }
      },
      // 取消按钮的回调函数
      onCancel: () => {
        // 取消删除操作，不做任何处理
      },
    })
  }
}

/**
 * 获取工作流的子标签信息
 * @param workflow - 工作流对象
 * @returns 返回包含工作流名称和节点数量的格式化字符串
 */
const getSubLabel = (workflow: GetWorkflowsWithPage) => {
  return `${workflow.name} • ${workflow.node_count} 节点`
}

/**
 * 获取工作流的日期信息
 * @param workflow - 工作流对象
 * @returns 返回包含编辑者名称和最近编辑时间的格式化字符串
 */
const getDate = (workflow: GetWorkflowsWithPage) => {
  return `${accountStore.account.name} • 最近编辑 ${formatDate(workflow.updated_at, 'MM-DD HH:mm')}`
}

/**
 * 处理工作流卡片点击事件
 * @param {number} idx - 被点击的工作流卡片在列表中的索引
 *
 * 该函数执行以下操作：
 * 1. 将被点击的工作流对象存储到workflowStore中，以便在其他组件中访问
 * 2. 使用Vue Router导航到工作流详情页面，并传递工作流ID作为路由参数
 */
const handleToolCardClick = (idx: number) => {
  // 将被点击的工作流对象存储到状态管理store中
  workflowStore.workflow = workflows.value[idx]
  // 导航到工作流详情页面，并传递工作流ID作为参数
  router.push({
    name: 'space-workflows-detail',
    params: {
      workflowId: workflows.value[idx].id,
    },
  })
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
 * 处理滚动事件，实现无限滚动加载
 * @param e - 滚动事件对象
 */
const handleScroll = (e: Event) => {
  // 获取滚动容器元素
  const target = e.target as HTMLElement
  // 判断是否滚动到底部附近（距离底部16px）
  // scrollTop: 已滚动的距离
  // clientHeight: 可视区域高度
  // scrollHeight: 总内容高度
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 16) {
    // 如果正在加载中，则不重复触发
    if (loading.value) return

    // 触发加载更多数据
    fetchData(true)
  }
}

// 挂载后执行，初始化数据
onMounted(() => {
  store.$reset()
  // 组件挂载后执行，初始化数据
  fetchData()
})

// 组件卸载前执行，清理副作用
onUnmounted(() => {
  // 停止watch监听器，避免内存泄漏
  stop()
})
</script>

<template>
  <div ref="scrollContainer" @scroll="handleScroll">
    <a-spin :loading="loading" class="block h-full w-full overflow-scroll scrollbar-w-none">
      <!-- 工具列表 -->
      <a-row :gutter="[20, 20]" class="flex-1">
        <a-col
          :xs="8"
          :sm="8"
          :md="8"
          :lg="8"
          :xl="6"
          :xxl="4"
          v-for="(workflow, idx) in workflows"
          :key="workflow.name"
        >
          <PageCard
            :icon="workflow.icon"
            background="#ffffff"
            :name="workflow.name"
            :sub-label="getSubLabel(workflow)"
            :description="workflow.description"
            :date="getDate(workflow)"
            @click="handleToolCardClick(idx)"
          >
            <template #subfix-title>
              <a-tooltip v-if="workflow?.status == 'published'" :content="'已发布'">
                <div
                  class="bg-green-500 rounded-full w-3.5 h-3.5 flex items-center justify-center shrink-0 ml-1"
                >
                  <icon-check class="w-2 h-2 text-white" />
                </div>
              </a-tooltip>
            </template>
            <a-dropdown position="br" @select="(v: string) => handleSelect(v, workflow)">
              <a-button @click.stop type="text" class="rounded-lg text-gray-700" size="small">
                <template #icon><icon-more /></template>
              </a-button>
              <template #content>
                <a-doption value="edit">编辑工作流</a-doption>
                <a-doption value="delete" class="text-red-500">删除</a-doption>
              </template>
            </a-dropdown>
          </PageCard>
        </a-col>
        <a-col :span="24" v-if="workflows.length === 0">
          <a-empty
            description="未找到相关结果"
            class="h-[400px] flex flex-col items-center justify-center"
          />
        </a-col>
      </a-row>
      <!-- 加载和 loading -->
      <LoadingStatus
        :loading="loading"
        :paginator="paginator"
        :has-data="workflows.length > 0"
        :show-load-more-btn="showLoadMoreBtn"
        @load-more="fetchData(true)"
      />
      <WorkflowModel
        v-model:visible="store.workflowModal.isOpen"
        :workflow="selectedWorkflow"
        @success="handleSuccess"
      />
    </a-spin>
  </div>
</template>

<style scoped></style>
