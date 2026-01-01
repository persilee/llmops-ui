<script setup lang="ts">
import APIToolsApi from '@/services/api/api-tool'
import type { GetAPIToolProvidersWithPage } from '@/services/api/api-tool/types'
import type { Paginator } from '@/services/types'
import PageCard from '@/views/components/PageCard.vue'

import LoadingStatus from '../../components/LoadingStatus.vue'
import ToolModal from './components/ToolModal.vue'

import { formatDate } from '@/utils/format-util'
import ToolDetailDrawer from '@/views/components/ToolDetailDrawer.vue'
import { Message } from '@arco-design/web-vue'
import { debounce } from 'lodash-es'
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { useSpaceStore } from '../SpaceView.store'

const providers = ref<GetAPIToolProvidersWithPage[]>([])
const paginator = ref<Paginator>({
  current_page: 1,
  page_size: 20,
  total_page: 0,
  total_record: 0,
})
const showIndex = ref<number>(-1)
const isShowToolDetail = ref<boolean>(false)
const loading = ref<boolean>(false)
const error = ref<string | null>(null)
const store = useSpaceStore()

const scrollContainerRef = useTemplateRef('scrollContainer')

// 计算属性：获取当前选中的工具提供者
const selectedProvider = computed(() => {
  return providers.value[showIndex.value]
})

// 获取工具列表数据
const fetchData = async (init?: boolean) => {
  if (!init && paginator.value.current_page >= paginator.value.total_page) return

  if (init) {
    paginator.value.current_page = 1
    providers.value = []
  } else {
    paginator.value.current_page++
  }

  loading.value = true
  error.value = null

  try {
    const resp = await APIToolsApi.getAPIToolProvidersWithPage({
      current_page: paginator.value.current_page,
      page_size: paginator.value.page_size,
      search_word: store.searchWord,
    })
    // 更新数据列表
    if (init) {
      providers.value = resp.data.list
      // 更新分页信息
      paginator.value = resp.data.paginator
    } else {
      providers.value.push(...resp.data.list)
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '数据加载失败'
    Message.error(errorMessage)
  } finally {
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
      debouncedFetchData(true) // 使用防抖函数重新获取数据，传入true表示初始化加载
    } else {
      fetchData(true) // 直接获取数据，传入true表示初始化加载
    }
  },
)

/**
 * 处理工具卡片点击事件
 * @param index - 被点击的工具卡片在列表中的索引位置
 * 该函数会：
 * 1. 设置当前选中的工具索引
 * 2. 打开工具详情抽屉显示详细信息
 */
const handleToolCardClick = (index: number) => {
  showIndex.value = index
  isShowToolDetail.value = true
}

const handleCloseDrawer = () => {
  isShowToolDetail.value = false
}

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
    fetchData(false)
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
 * 获取工具提供商的子标签信息
 * @param provider - 工具提供商对象
 * @returns 返回格式化的子标签字符串，包含提供商名称和工具数量
 */
const getSubLabel = (provider: GetAPIToolProvidersWithPage) => {
  return `提供商 ${provider.name} • ${provider.tools.length}`
}

/**
 * 获取工具提供商的发布时间信息
 * @param provider - 工具提供商对象，包含创建时间
 * @returns 返回格式化的日期字符串，包含用户信息和发布时间
 * 格式为："User • 发布时间 ${MM-DD HH:mm}"
 */
const getDate = (provider: GetAPIToolProvidersWithPage) => {
  return `User • 发布时间 ${formatDate(provider.created_at, 'MM-DD HH:mm')}`
}

// 处理模态框成功操作
const handleModalSuccess = () => {
  // 刷新数据列表
  fetchData(true)
  // 关闭详情抽屉
  handleCloseDrawer()
}

/**
 * 组件挂载到DOM后执行的生命周期钩子
 * 执行以下初始化操作：
 * 1. 重置store状态，确保组件状态干净
 * 2. 调用fetchData(true)初始化加载第一页数据
 */
onMounted(() => {
  store.$reset()
  fetchData(true)
  console.log('aaaaaaaaaa', store)
})

/**
 * 组件卸载前执行的生命周期钩子
 * 执行以下清理操作：
 * 1. 停止watch监听器，避免内存泄漏
 * 2. 重置store状态，确保组件状态干净
 */
onUnmounted(() => {
  stop()
  store.$reset()
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
          v-for="(provider, idx) in providers"
          :key="provider.name"
        >
          <PageCard
            :icon="provider.icon"
            background="#ffffff"
            :name="provider.name"
            :sub-label="getSubLabel(provider)"
            :description="provider.description"
            :date="getDate(provider)"
            @click="handleToolCardClick(idx)"
          />
        </a-col>
        <a-col :span="24" v-if="providers.length === 0">
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
        :has-data="providers.length > 0"
        :show-load-more-btn="showLoadMoreBtn"
        @load-more="fetchData(false)"
      />
      <ToolDetailDrawer
        v-if="selectedProvider"
        v-model:visible="isShowToolDetail"
        :provider="selectedProvider"
        :icon="selectedProvider.icon"
        background="#ffffff"
        :name="selectedProvider.name"
        @update:visible="handleCloseDrawer"
        @update-tool-provider="store.openCreateToolModal()"
      />
      <!-- 工具模态框 -->
      <ToolModal
        v-if="store"
        v-model:visible="store.toolModal.isOpen"
        :provider="selectedProvider"
        @success="handleModalSuccess"
      />
    </a-spin>
  </div>
</template>
