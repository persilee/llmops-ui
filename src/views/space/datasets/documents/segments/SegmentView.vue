<script setup lang="ts">
import DocumentsApi from '@/services/api/dataset/documents'
import type { GetDocumentResp } from '@/services/api/dataset/documents/type'
import SegmentsApi from '@/services/api/dataset/segments'
import type { GetSegmentsWithPage } from '@/services/api/dataset/segments/types'
import type { Paginator } from '@/services/types'
import { formatNumberWithCommas, padWithZeros } from '@/utils/util'
import InputSearch from '@/views/components/InputSearch.vue'
import LoadingStatus from '@/views/components/LoadingStatus.vue'
import { debounce } from 'lodash-es'
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { useDatasetStore } from '../../DatasetView.store'
import SegmentHeader from './components/SegmentHeader.vue'

const router = useRouter()
const store = useDatasetStore()
const document = ref<GetDocumentResp>()
const segments = ref<GetSegmentsWithPage[]>([])
const loading = ref(false)
const headerLoading = ref(false)
const searchWord = ref('')
const paginator = ref<Paginator>({
  current_page: 1,
  page_size: 20,
  total_page: 0,
  total_record: 0,
})
const scrollContainerRef = useTemplateRef('scrollContainer')

const handleBackClick = () => {
  router.replace({
    name: 'space-datasets-documents',
    params: { datasetId: store.dataset?.id },
  })
}

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
    segments.value = []
  }

  try {
    if (store.dataset && store.dataset.id && store.document && store.document.id) {
      // 开启加载状态
      loading.value = true
      // 调用API获取数据
      const resp = await SegmentsApi.getSegmentsWithPage(store.dataset.id, store.document.id, {
        current_page: paginator.value.current_page,
        page_size: paginator.value.page_size,
        search_word: searchWord.value,
      })

      // 将新数据追加到现有列表中
      segments.value.push(...resp.data.list)
      // 更新分页信息
      paginator.value = resp.data.paginator
    }
  } catch (error) {
    // 错误处理
    console.error('获取片段列表失败:', error)
  } finally {
    // 无论成功失败都关闭加载状态
    loading.value = false
  }
}

const fetchDocumentById = async () => {
  try {
    if (store.dataset && store.dataset.id && store.document && store.document.id) {
      headerLoading.value = true
      const resp = await DocumentsApi.getDocument(store.dataset.id, store.document.id)
      document.value = resp.data
    }
  } catch (error) {
  } finally {
    headerLoading.value = false
  }
}

const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 16) {
    if (loading.value) return

    fetchData(true)
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

// 创建防抖函数，延迟300ms执行数据获取，避免频繁请求
const debouncedFetchData = debounce(fetchData, 300)

const handleSearch = (value: string) => {
  searchWord.value = value

  if (searchWord.value) {
    debouncedFetchData() // 使用防抖函数重新获取数据
  } else {
    fetchData() // 直接获取数据
  }
}

onMounted(async () => {
  await fetchData()
  await fetchDocumentById()
})

onUnmounted(() => {
  stop()
})
</script>

<template>
  <div class="flex flex-col p-6 h-full">
    <SegmentHeader :loading="headerLoading" :document="document" @back-click="handleBackClick" />
    <!-- 搜索、可用、添加片段-->
    <div class="flex items-center w-full justify-between mb-6">
      <InputSearch
        placeholder="输入关键词搜索片段"
        :search-word="searchWord"
        @update:searchWord="handleSearch"
      />
      <a-space :size="12">
        <a-tag class="rounded-lg bg-white border-1 border-gray-200 text-gray-700 p-[15px]">
          <a-badge v-if="document?.enabled" status="success" text="可用" />
          <a-badge v-else status="normal" text="已禁用"
        /></a-tag>
        <a-button class="rounded-lg bg-white border-1 border-gray-200 text-gray-700">
          <template #icon>
            <img src="@/assets/images/icon-add-segment.png" class="w-4 h-4" />
          </template>
          添加片段</a-button
        >
      </a-space>
    </div>
    <!-- 中间片段内容 -->
    <div
      class="block h-full w-full overflow-scroll scrollbar-w-none"
      ref="scrollContainer"
      @scroll="handleScroll"
    >
      <a-spin :loading="loading" class="block h-full w-full">
        <a-row :gutter="[20, 20]">
          <a-col :span="6" v-for="segment in segments" :key="segment.id">
            <!-- 卡片内容 -->
            <a-card hoverable class="cursor-pointer rounded-lg">
              <div class="flex flex-col">
                <!-- 头部（序号、禁用标识和切换按钮） -->
                <div class="flex items-center justify-between">
                  <!-- 序号 -->
                  <a-tag
                    size="small"
                    class="rounded-md bg-gray-50 border-1 border-gray-200 text-gray-400"
                    ><template #icon
                      ><img src="@/assets/images/icon-hash.png" class="w-3 h-3"
                    /></template>
                    {{ padWithZeros(segment.position) }}</a-tag
                  >
                  <!-- 禁用标识和切换按钮 -->
                  <div class="flex items-center">
                    <!-- 左边文字和圆点 -->
                    <div class="flex gap-1">
                      <span class="text-xs text-gray-400">{{
                        segment.enabled ? '已启用' : '已禁用'
                      }}</span>
                      <a-badge v-if="segment.enabled" status="success" />
                      <a-badge v-else status="normal" />
                    </div>
                    <!-- 中间竖线 -->
                    <a-divider direction="vertical" class="mx-1.5 min-h-2.5" />
                    <!-- 右边切换按钮 -->
                    <a-switch size="small" type="round" />
                  </div>
                </div>
                <!-- 中间内容 -->
                <div class="leading-[18px] text-gray-500 h-[72px] line-clamp-5 my-2">
                  {{ segment.content }}
                </div>
                <!-- 底部（字符数、命中数和删除按钮） -->
                <div class="flex justify-between items-center">
                  <!-- 字符数、命中数 -->
                  <div class="flex gap-3">
                    <div class="flex items-center gap-1">
                      <img src="@/assets/images/icon-file.png" class="h-2.5" />
                      <div class="text-xs text-gray-400">
                        {{ formatNumberWithCommas(segment.character_count) }} 字符
                      </div>
                    </div>
                    <div class="flex items-center gap-1">
                      <img src="@/assets/images/icon-score.png" class="h-2.5" />
                      <div class="text-xs text-gray-400">
                        {{ formatNumberWithCommas(segment.hit_count) }} 命中
                      </div>
                    </div>
                  </div>
                  <!-- 删除按钮 -->
                  <a-button type="text" size="mini" class="text-gray-400">
                    <template #icon><icon-delete /></template>
                  </a-button>
                </div>
              </div>
            </a-card>
          </a-col>
        </a-row>
      </a-spin>
      <!-- 加载和 loading -->
      <LoadingStatus
        :loading="loading"
        :paginator="paginator"
        :has-data="segments.length > 0"
        :show-load-more-btn="showLoadMoreBtn"
        @load-more="fetchData(true)"
      />
    </div>
  </div>
</template>

<style scoped></style>
