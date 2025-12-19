<script setup lang="ts">
import DocumentsApi from '@/services/api/dataset/documents'
import type { GetDocumentResp } from '@/services/api/dataset/documents/type'
import SegmentsApi from '@/services/api/dataset/segments'
import type { GetSegmentsWithPage } from '@/services/api/dataset/segments/types'
import type { Paginator } from '@/services/types'
import InputSearch from '@/views/components/InputSearch.vue'
import { Message, Modal } from '@arco-design/web-vue'
import { debounce } from 'lodash-es'
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDatasetStore } from '../../DatasetView.store'
import SegmentContent from './components/SegmentContent.vue'
import SegmentHeader from './components/SegmentHeader.vue'
import SegmentModal from './components/SegmentModal.vue'

// 初始化路由实例，用于页面导航
const router = useRouter()
// 初始化知识库store，用于管理知识库相关的状态
const store = useDatasetStore()
// 文档详情的响应式变量，存储当前文档的详细信息
const document = ref<GetDocumentResp>()
// 片段列表的响应式变量，存储当前文档的所有片段数据
const segments = ref<GetSegmentsWithPage[]>([])
// 选择的片段的响应式变量，存储用户选择的片段数据
const selectSegment = ref<GetSegmentsWithPage | null>()
// 加载状态的响应式变量，用于控制片段列表的加载状态
const loading = ref(false)
// 头部加载状态的响应式变量，用于控制文档详情的加载状态
const headerLoading = ref(false)
// 模态框显示状态的响应式变量，用于控制片段编辑模态框的显示与隐藏
const visible = ref(false)
// 搜索关键词的响应式变量，存储用户输入的搜索内容
const searchWord = ref('')
// 分页器的响应式变量，用于管理片段列表的分页信息
const paginator = ref<Paginator>({
  current_page: 1, // 当前页码，默认为1
  page_size: 20, // 每页显示数量，默认为20条
  total_page: 0, // 总页数，初始为0
  total_record: 0, // 总记录数，初始为0
})

/**
 * 处理返回按钮点击事件
 * @description
 * 当用户点击返回按钮时，导航回文档列表页面
 * 使用router.replace方法替换当前路由，避免在浏览器历史记录中留下当前页面
 */
const handleBackClick = () => {
  router.replace({
    name: 'space-datasets-documents', // 目标路由名称
    params: { datasetId: store.dataset?.id }, // 传递知识库ID作为路由参数
  })
}

/**
 * 获取片段列表数据
 * @param isLoadMore 是否为加载更多数据的模式，默认为 false
 * @description
 * 1. 处理分页逻辑：根据 isLoadMore 参数决定是加载更多还是重新加载
 * 2. 如果是加载更多：
 *    - 检查是否还有下一页数据
 *    - 递增页码
 * 3. 如果是重新加载：
 *    - 重置页码为 1
 *    - 清空现有数据
 * 4. 调用 API 获取数据：
 *    - 使用当前页码、页面大小和搜索词作为参数
 *    - 将新数据追加到现有列表中
 *    - 更新分页信息
 * 5. 错误处理：捕获并记录获取数据时的错误
 * 6. 无论成功失败都关闭加载状态
 * @returns Promise<void>
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

/**
 * 获取文档详情
 * 从服务器获取指定文档的详细信息，并更新到 document 响应式变量中
 *
 * @returns Promise<void>
 */
const fetchDocumentById = async () => {
  try {
    // 检查必要的数据是否存在：知识库ID和文档ID
    if (store.dataset && store.dataset.id && store.document && store.document.id) {
      // 开启加载状态，用于显示加载动画
      headerLoading.value = true
      // 调用API获取文档详情
      const resp = await DocumentsApi.getDocument(store.dataset.id, store.document.id)
      // 将获取到的文档数据存储到响应式变量中
      document.value = resp.data
    }
  } catch (error) {
    // 错误处理：如果获取文档详情失败，保持原有状态
  } finally {
    // 无论成功失败，都关闭加载状态
    headerLoading.value = false
  }
}

/**
 * 处理片段启用状态的切换
 * @param v 新的启用状态值
 * @param segment 需要更新的片段对象
 * @returns Promise<void>
 */
const handleChangeEnabled = async (v: boolean, ev: Event, segment: GetSegmentsWithPage) => {
  ev.stopPropagation()
  try {
    // 检查必要的数据是否存在：知识库ID、文档ID和片段对象
    if (store.dataset && store.dataset.id && store.document && store.document.id && segment) {
      // 开启加载状态，用于显示加载动画
      loading.value = true
      // 调用API更新片段的启用状态
      const resp = await SegmentsApi.updateSegmentEnabled(
        store.dataset.id,
        store.document.id,
        segment.id,
        { enabled: v as boolean },
      )
      // 如果更新成功，显示成功消息并更新本地状态
      if (resp.code == 'success') {
        Message.success(resp.message)
        segment.enabled = v
      }
    }
  } catch (error) {
    // 如果更新失败，恢复片段的原始状态
    segment.enabled = !v
  } finally {
    // 无论成功失败，都关闭加载状态
    loading.value = false
  }
}

/**
 * 处理删除文档片段的操作
 * @param segment 需要删除的文档片段对象
 * @description
 * 1. 显示确认对话框，提醒用户删除操作的影响
 * 2. 用户确认后执行删除操作：
 *    - 检查必要的数据是否存在（知识库ID、文档ID和片段对象）
 *    - 开启加载状态
 *    - 调用API删除片段
 *    - 删除成功后显示成功消息并更新本地状态
 * 3. 错误处理：捕获删除过程中的错误
 * 4. 无论成功失败都关闭加载状态
 * @returns Promise<void>
 */
const handleDelete = async (segment: GetSegmentsWithPage) => {
  Modal.warning({
    title: '要删除该文档片段吗？', // 模态框标题
    content:
      '删除文档后，知识库/向量数据库将无法检索到该文档，如需暂时关闭该文档的检索，可以选择禁用功能。', // 提示内容
    hideCancel: false, // 显示取消按钮
    titleAlign: 'start', // 标题左对齐
    simple: false, // 简单模式
    // 确认按钮的回调函数
    onOk: async () => {
      try {
        // 检查必要的数据是否存在：知识库ID、文档ID和片段对象
        if (store.dataset && store.dataset.id && store.document && store.document.id && segment) {
          // 开启加载状态，用于显示加载动画
          loading.value = true
          // 调用API删除片段
          const resp = await SegmentsApi.deleteSegment(
            store.dataset.id,
            store.document.id,
            segment.id,
          )
          // 如果删除成功，显示成功消息并更新本地状态
          if (resp.code == 'success') {
            Message.success(resp.message)
            segments.value = segments.value.filter((item) => item.id !== segment.id)
          }
        }
      } catch (error) {
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
 * 处理模态框显示状态的更新
 * @param v 模态框的新显示状态
 * @description
 * 1. 更新模态框的显示状态
 * 2. 如果模态框关闭，清空选中的片段数据
 */
const handleUpdateVisible = (v: boolean) => {
  visible.value = v
  if (!v) {
    selectSegment.value = null
  }
}

/**
 * 处理添加新片段的操作
 * @description
 * 打开片段编辑模态框，用于创建新的片段
 */
const handleAddSegment = () => {
  visible.value = true
}

/**
 * 处理点击片段时的操作
 * @param segment 被点击的片段对象
 * @description
 * 1. 设置当前选中的片段
 * 2. 打开片段编辑模态框，用于编辑选中的片段
 */
const handleSegmentClick = (segment: GetSegmentsWithPage) => {
  selectSegment.value = segment
  visible.value = true
}

/**
 * 处理操作成功后的回调
 * @description
 * 1. 关闭模态框
 * 2. 重新获取片段列表数据，以显示最新的数据
 */
const handleSuccess = () => {
  visible.value = false
  fetchData()
}

/**
 * 处理滚动事件，实现无限滚动加载
 * @param e 滚动事件对象
 */
const handleScroll = (e: Event) => {
  // 获取滚动容器元素
  const target = e.target as HTMLElement
  // 判断是否滚动到接近底部（距离底部16px时触发）
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 16) {
    // 如果正在加载中，则不重复触发
    if (loading.value) return

    // 触发加载更多数据
    fetchData(true)
  }
}

// 创建防抖函数，延迟300ms执行数据获取，避免频繁请求
const debouncedFetchData = debounce(fetchData, 300)

/**
 * 处理搜索功能
 * @param value 搜索关键词
 * @description
 * 1. 更新搜索词状态
 * 2. 如果有搜索词，使用防抖函数获取数据（避免频繁请求）
 * 3. 如果搜索词为空，直接获取数据（显示全部）
 */
const handleSearch = (value: string) => {
  searchWord.value = value

  if (searchWord.value) {
    debouncedFetchData() // 使用防抖函数重新获取数据
  } else {
    fetchData() // 直接获取数据
  }
}

/**
 * 组件挂载后执行的生命周期钩子
 * 用于初始化页面数据：
 * 1. 获取片段列表数据
 * 2. 获取文档详情信息
 */
onMounted(async () => {
  await fetchData()
  await fetchDocumentById()
})

/**
 * 组件卸载前执行的生命周期钩子
 * 用于清理工作，防止内存泄漏
 */
onUnmounted(() => {})
</script>

<template>
  <div class="flex flex-col p-6 h-full">
    <!-- 返回、标题、标签 -->
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
        <a-button
          class="rounded-lg bg-white border-1 border-gray-200 text-gray-700"
          @click="handleAddSegment"
        >
          <template #icon>
            <img src="@/assets/images/icon-add-segment.png" class="w-4 h-4" />
          </template>
          添加片段</a-button
        >
      </a-space>
    </div>
    <!-- 中间片段内容 -->
    <SegmentContent
      :loading="loading"
      :paginator="paginator"
      :segments="segments"
      @scroll="handleScroll"
      @load-more="fetchData(true)"
      @change-enabled="handleChangeEnabled"
      @delete="handleDelete"
      @segment-click="handleSegmentClick"
    />
    <SegmentModal
      v-model:visible="visible"
      :segment="selectSegment"
      @update:visible="handleUpdateVisible"
      @success="handleSuccess"
    />
  </div>
</template>

<style scoped></style>
