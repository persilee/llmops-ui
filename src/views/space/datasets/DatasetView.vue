<script setup lang="ts">
import DatasetApi from '@/services/api/dataset'
import type { GetDatasetsWithPage } from '@/services/api/dataset/types'
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
import DatasetModal from './components/DatasetModal.vue'
import { useDatasetStore } from './DatasetView.store'

// 路由实例，用于页面导航
const router = useRouter()
// 加载状态标志，用于控制加载动画的显示
const loading = ref(false)
// 知识库列表，存储所有加载的知识库
const datasets = ref<GetDatasetsWithPage[]>([])
// 当前选中的知识库，用于编辑操作
const selectedDataset = ref<GetDatasetsWithPage>()
// 分页信息，包含当前页码、每页数量、总页数和总记录数
const paginator = ref<Paginator>({
  current_page: 1,
  page_size: 20,
  total_page: 0,
  total_record: 0,
})
// 空间状态管理store，用于管理空间相关的状态
const store = useSpaceStore()
// 用户状态管理store，用于管理用户相关的状态
const accountStore = useAccountStore()
// 知识库状态管理store，用于管理知识库相关的状态
const datasetStore = useDatasetStore()
// 滚动容器的模板引用，用于实现无限滚动功能
const scrollContainerRef = useTemplateRef('scrollContainer')

/**
 * 获取知识库列表数据
 * @param isLoadMore 是否为加载更多操作，默认为false
 *                  - true: 加载下一页数据
 *                  - false: 重新加载第一页数据
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
    datasets.value = []
  }

  try {
    // 开启加载状态
    loading.value = true
    // 调用API获取数据
    const resp = await DatasetApi.getDatasetsWithPage({
      current_page: paginator.value.current_page,
      page_size: paginator.value.page_size,
      search_word: store.searchWord,
    })
    // 将新数据追加到现有列表中
    datasets.value.push(...resp.data.list)
    // 更新分页信息
    paginator.value = resp.data.paginator
  } catch (error) {
    // 错误处理
    console.error('获取知识库列表失败:', error)
  } finally {
    // 无论成功失败都关闭加载状态
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

/**
 * 获取知识库的子标签信息
 * @param dataset 知识库对象，包含文档数量、字符数和关联应用数量等信息
 * @returns 返回格式化后的字符串，包含文档数、千字符数和关联应用数
 */
const getSubLabel = (dataset: GetDatasetsWithPage) => {
  return `${dataset.document_count} 文档 • ${Math.round(dataset.character_count / 1000)} 千字符 • ${dataset.related_app_count} 关联应用`
}

/**
 * 获取知识库的子标签信息
 * @param dataset 知识库对象，包含文档数量、字符数和关联应用数量等信息
 * @returns 返回格式化后的字符串，包含文档数、千字符数和关联应用数
 */
const getDate = (dataset: GetDatasetsWithPage) => {
  return `${accountStore.account.name} • 最近编辑 ${formatDate(dataset.updated_at, 'MM-DD HH:mm')}`
}

/**
 * 处理下拉菜单选择事件
 * @param v 选择的值，可以是 'edit' 或 'delete'
 * @param dataset 当前操作的知识库对象
 */
const handleSelect = async (v: string, dataset: GetDatasetsWithPage) => {
  // 如果选择的是编辑操作
  if (v == 'edit') {
    selectedDataset.value = dataset
    store.openEditDatasetModal()
  }
  // 如果选择的是删除操作
  if (v == 'delete') {
    handelDelete(dataset)
  }
}

/**
 * 处理删除知识库
 * @param dataset 要删除的知识库
 */
const handelDelete = async (dataset: GetDatasetsWithPage) => {
  Modal.warning({
    title: '要删除知识库吗？', // 模态框标题
    content:
      '删除知识库后，关联该知识库的应用将无法再使用该知识库，所有的提示配置和文档都将被永久删除。', // 提示内容
    hideCancel: false, // 显示取消按钮
    titleAlign: 'start', // 标题左对齐
    simple: false, // 简单模式
    modalClass: 'delete-modal',
    okText: '删除', // 确认按钮文本
    // 确认按钮的回调函数
    onOk: async () => {
      try {
        loading.value = true
        const resp = await DatasetApi.deleteDataset(dataset.id)
        if (resp.code == 'success') {
          Message.success(resp.message)
          datasets.value = datasets.value.filter((item) => item.id !== dataset.id)
        }
      } finally {
        loading.value = false
      }
    },
    onCancel: () => {
      // 取消删除操作
    },
  })
}

/**
 * 跳转到知识库文档页面
 * @param dataset 当前操作的知识库对象，包含知识库的基本信息
 */
const handelToDocument = (dataset: GetDatasetsWithPage) => {
  // 将当前知识库信息存储到store中，供其他组件使用
  datasetStore.dataset = dataset

  // 使用Vue Router导航到知识库文档页面
  // 路由名称为'space-datasets-documents'，并传递知识库ID作为参数
  router.push({
    name: 'space-datasets-documents',
    params: { datasetId: dataset.id },
  })
}

// 组件挂载完成后执行的生命周期钩子
// 在这里调用fetchData获取初始数据，确保页面加载时显示数据列表
onMounted(() => {
  fetchData()
})

/**
 * 组件卸载时的生命周期钩子
 * 执行清理操作，防止内存泄漏和状态污染
 */
onUnmounted(() => {
  stop() // 停止watch监听，避免内存泄漏
  store.$reset() // 重置store状态，清除组件相关的数据
})
</script>

<template>
  <div ref="scrollContainer" @scroll="handleScroll">
    <a-spin :loading="loading" class="block h-full w-full overflow-scroll scrollbar-w-none">
      <!-- 知识库列表 -->
      <a-row :gutter="[20, 20]" class="flex-1">
        <a-col
          :xs="8"
          :sm="8"
          :md="8"
          :lg="8"
          :xl="6"
          :xxl="4"
          v-for="dataset in datasets"
          :key="dataset.id"
        >
          <PageCard
            :icon="dataset.icon"
            background="#ffffff"
            :name="dataset.name"
            :sub-label="getSubLabel(dataset)"
            :description="dataset.description"
            :date="getDate(dataset)"
            @click="handelToDocument(dataset)"
          >
            <a-dropdown position="br" @select="(v: string) => handleSelect(v, dataset)">
              <a-button @click.stop type="text" class="rounded-lg text-gray-700" size="small">
                <template #icon><icon-more /></template>
              </a-button>
              <template #content>
                <a-doption value="edit">设置</a-doption>
                <a-doption value="delete" class="text-red-500">删除</a-doption>
              </template>
            </a-dropdown>
          </PageCard>
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
        v-model:visible="store.datasetModal.isOpen"
        :dataset="selectedDataset"
        @success="fetchData()"
      />
    </a-spin>
  </div>
</template>

<style scoped></style>
