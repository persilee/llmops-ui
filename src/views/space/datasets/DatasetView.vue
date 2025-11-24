<script setup lang="ts">
import DatasetApi from '@/services/api/dataset'
import type { GetDatasetsWithPage } from '@/services/api/dataset/types'
import type { Paginator } from '@/services/types'
import { formatDate } from '@/utils/format-util'
import LoadingStatus from '@/views/components/LoadingStatus.vue'
import PageCard from '@/views/components/PageCard.vue'
import { Message } from '@arco-design/web-vue'
import { debounce } from 'lodash-es'
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { useSpaceStore } from '../SpaceView.store'
import DatasetModal from './components/DatasetModal.vue'
import { useDatasetStore } from './DatasetView.store'

const loading = ref(false)
const datasets = ref<GetDatasetsWithPage[]>([])
const selectedDataset = ref<GetDatasetsWithPage>()
const paginator = ref<Paginator>({
  current_page: 1,
  page_size: 20,
  total_page: 0,
  total_record: 0,
})
const store = useSpaceStore()
const datasetStore = useDatasetStore()
const scrollContainerRef = useTemplateRef('scrollContainer')

const fetchData = async (isLoadMore: boolean = false) => {
  if (isLoadMore) {
    if (paginator.value.current_page >= paginator.value.total_page) return
    paginator.value.current_page++
  } else {
    paginator.value.current_page = 1
    datasets.value = []
  }

  try {
    loading.value = true
    const resp = await DatasetApi.getDatasetsWithPage({
      current_page: paginator.value.current_page,
      page_size: paginator.value.page_size,
      search_word: store.searchWord,
    })
    datasets.value.push(...resp.data.list)
    paginator.value = resp.data.paginator
  } catch (error) {
  } finally {
    loading.value = false
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

const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 16) {
    if (loading.value) return

    fetchData(true)
  }
}

// 创建防抖函数，延迟300ms执行数据获取，避免频繁请求
const debouncedFetchData = debounce(fetchData, 300)

// 监听搜索词变化，当搜索词改变时触发数据重新加载
const stop = watch(
  () => store.searchWord,
  (newVal) => {
    if (newVal) {
      debouncedFetchData() // 使用防抖函数重新获取数据
    } else {
      fetchData() // 直接获取数据
    }
  },
)

const getSubLabel = (dataset: GetDatasetsWithPage) => {
  return `${dataset.document_count} 文档 • ${Math.round(dataset.character_count / 1000)} 千字符 • ${dataset.related_app_count} 关联应用`
}

const getDate = (dataset: GetDatasetsWithPage) => {
  return `User • 最近编辑 ${formatDate(dataset.created_at, 'MM-DD HH:mm')}`
}

const handleSelect = async (v: string, dataset: GetDatasetsWithPage) => {
  if (v == 'edit') {
    selectedDataset.value = dataset
    store.openEditDatasetModal()
  }
  if (v == 'delete') {
    try {
      loading.value = true
      const resp = await DatasetApi.deleteDataset(dataset.id)
      Message.success(resp.message)
      await fetchData()
    } finally {
      loading.value = false
    }
  }
}

const handelToDocument = (dataset: GetDatasetsWithPage) => {
  datasetStore.dataset = dataset
}

onMounted(() => {
  fetchData()
})

onUnmounted(() => {
  stop()
  store.$reset()
})
</script>

<template>
  <div ref="scrollContainer" @scroll="handleScroll">
    <a-spin :loading="loading" class="block h-full w-full overflow-scroll scrollbar-w-none">
      <!-- 知识库列表 -->
      <a-row :gutter="[20, 20]" class="flex-1">
        <a-col :span="6" v-for="dataset in datasets" :key="dataset.id">
          <RouterLink
            :to="{
              name: 'space-datasets-documents',
              params: { datasetId: dataset.id },
            }"
            @click="handelToDocument(dataset)"
          >
            <PageCard
              :icon="dataset.icon"
              background="#ffffff"
              :name="dataset.name"
              :sub-label="getSubLabel(dataset)"
              :description="dataset.description"
              :date="getDate(dataset)"
            >
              <a-dropdown position="br" @select="(v: string) => handleSelect(v, dataset)">
                <a-button type="text" class="rounded-lg text-gray-700" size="small">
                  <template #icon><icon-more /></template>
                </a-button>
                <template #content>
                  <a-doption value="edit">设置</a-doption>
                  <a-doption value="delete" class="text-red-500">删除</a-doption>
                </template>
              </a-dropdown>
            </PageCard>
          </RouterLink>
        </a-col>
        <a-col :span="24" v-if="datasets.length === 0">
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
        :has-data="datasets.length > 0"
        :show-load-more-btn="showLoadMoreBtn"
        @load-more="fetchData(true)"
      />

      <DatasetModal
        v-model:visible="store.openDatasetModal"
        :dataset="selectedDataset"
        @success="fetchData()"
      />
    </a-spin>
  </div>
</template>

<style scoped></style>
