<script setup lang="ts">
import APIToolsApi from '@/services/api/api-tool'
import type { GetAPIToolProvidersWithPage } from '@/services/api/api-tool/types'
import type { Paginator } from '@/services/types'
import PageCard from '@/views/components/PageCard.vue'

import LoadingStatus from './components/LoadingStatus.vue'
import ToolModal from './components/ToolModal.vue'

import ToolDetailDrawer from '@/views/components/ToolDetailDrawer.vue'
import { Message } from '@arco-design/web-vue'
import { debounce } from 'lodash-es'
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { useToolProviderStore } from '../SpaceView.store'

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
const store = useToolProviderStore()

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
    error.value = errorMessage
    console.error('获取工具列表失败:', err)
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

const handleToolCardClick = (index: number) => {
  showIndex.value = index
  isShowToolDetail.value = true
}

const handleCloseDrawer = () => {
  isShowToolDetail.value = false
}

const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 16) {
    if (loading.value) return

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

// 处理模态框关闭的函数
const handleCloseModal = () => {
  store.closeCreateToolModal() // 关闭创建工具的模态框
}

// 处理模态框成功操作
const handleModalSuccess = () => {
  // 刷新数据列表
  fetchData(true)
  // 关闭详情抽屉
  handleCloseDrawer()
}

onMounted(() => {
  fetchData(true)
})

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
        <a-col :span="6" v-for="(provider, idx) in providers" :key="provider.name">
          <PageCard :data="provider" @click="handleToolCardClick(idx)" />
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
        v-model:visible="isShowToolDetail"
        :provider="selectedProvider"
        @update:visible="handleCloseDrawer"
        @update-tool-provider="store.openCreateToolModal(true)"
      />
      <!-- 工具模态框 -->
      <ToolModal
        v-model:visible="store.isOpenCreateToolModal"
        :provider="selectedProvider"
        @success="handleModalSuccess"
      />
    </a-spin>
  </div>
</template>
