<script setup lang="ts">
import DatasetApi from '@/services/api/dataset'
import DocumentsApi from '@/services/api/dataset/documents'
import type { GetDocumentsWithPage } from '@/services/api/dataset/documents/type'
import type { GetDatasetResp } from '@/services/api/dataset/types'
import HeaderSkeleton from '@/views/components/HeaderSkeleton.vue'
import InputSearch from '@/views/components/InputSearch.vue'
import { Message, Modal } from '@arco-design/web-vue'
import { debounce } from 'lodash-es'
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDatasetStore } from '../DatasetView.store'
import DocumentModal from '../components/DocumentModal.vue'
import DocumentTable from '../components/DocumentTable.vue'
import HitModal from '../components/HitModal.vue'

// 使用知识库状态管理store
const store = useDatasetStore()
// 加载状态，用于控制表格加载动画
const loading = ref(false)
// 知识库详细信息，包含知识库的基本信息、文档数量、命中次数等数据
const dataset = ref<GetDatasetResp>()
// 文档列表数据，类型为GetDocumentsWithPage数组
const documents = ref<GetDocumentsWithPage[]>([])
// 当前选中的文档对象，用于编辑操作
const document = ref<GetDocumentsWithPage | null>(null)
// 搜索关键词
const searchWord = ref('')
// 分页配置对象
const pagination = reactive({
  total: 0, // 总数据条数
  current: 1, // 当前页码
  defaultCurrent: 1, // 默认页码
  pageSize: 20, // 每页显示条数
  defaultPageSize: 20, // 默认每页显示条数
  showTotal: true, // 是否显示总条数
})
// 控制文档编辑模态框的显示状态
const visible = ref(false)
// 召回测试模态框的显示状态
const hitVisible = ref(false)
// 获取当前路由信息
const route = useRoute()
const router = useRouter()

/**
 * 获取文档列表数据
 * @description 从服务器获取分页的文档列表数据，并更新本地状态
 */
const fetchData = async () => {
  try {
    // 开启加载状态
    loading.value = true

    // 调用API获取文档列表
    const resp = await DocumentsApi.getDocumentsWithPage(route.params.datasetId as string, {
      current_page: pagination.current, // 当前页码
      page_size: pagination.pageSize, // 每页条数
      search_word: searchWord.value, // 搜索关键词
    })
    // 更新文档列表数据
    documents.value = resp.data.list
    // 更新分页总条数
    pagination.total = resp.data.paginator.total_record
  } catch (error) {
    // 错误处理
    console.error('获取文档列表失败:', error)
  } finally {
    // 关闭加载状态
    loading.value = false
  }
}

/**
 * 获取知识库详细信息
 * @description 根据路由参数中的知识库ID，从服务器获取知识库的详细信息
 *              包括知识库名称、文档数量、命中次数等数据
 * @async
 * @returns {Promise<void>} 无返回值，但会更新dataset.value
 * @throws {Error} 当API调用失败时抛出错误
 */
const fetchDatasetById = async () => {
  try {
    // 开启加载状态
    loading.value = true
    // 调用API获取知识库详情
    const resp = await DatasetApi.getDataset(route.params.datasetId as string)
    // 更新知识库信息
    dataset.value = resp.data
  } catch (error) {
    // 错误处理：获取知识库信息失败
    console.error('获取知识库信息失败:', error)
  } finally {
    // 关闭加载状态
    loading.value = false
  }
}

/**
 * 处理分页变化
 * @param page - 新的页码
 */
const handlePageChange = (page: number) => {
  pagination.current = page
  fetchData()
}

/**
 * 处理文档启用/禁用状态切换
 * @param v - 新的启用状态，true表示启用，false表示禁用
 * @param document - 需要修改状态的文档对象
 */
const handleSwitchChange = async (v: boolean, ev: Event, document: GetDocumentsWithPage) => {
  ev.stopPropagation()
  try {
    // 开启加载状态
    loading.value = true
    // 调用API更新文档启用状态
    const resp = await DocumentsApi.updateDocumentEnabled(
      route.params.datasetId as string,
      document.id,
      {
        enabled: v,
      },
    )
    // 如果更新成功，显示成功消息
    if (resp.code == 'success') {
      Message.success(resp.message)
    }
    // 重新获取文档列表数据
    fetchData()
  } catch (error) {
    // 如果更新失败，恢复文档的原始状态
    document.enabled = !v
  } finally {
    // 无论成功失败，都关闭加载状态
    loading.value = false
  }
}

/**
 * 创建防抖处理的数据获取函数
 * @description 使用lodash的debounce函数包装fetchData，延迟300ms执行，用于优化搜索性能
 */
const debouncedFetchData = debounce(fetchData, 300)

/**
 * 处理搜索操作
 * @param value - 搜索关键词
 * @description 更新搜索关键词，重置分页到第一页，并触发防抖的数据获取
 */
const handleSearch = (value: string) => {
  searchWord.value = value
  pagination.current = 1
  debouncedFetchData()
}

/**
 * 处理文档选择操作
 * @param v - 操作类型，'rename'表示重命名，其他值表示删除
 * @param data - 被选中的文档对象
 * @description 根据操作类型执行重命名或删除文档的操作
 */
const handleSelect = (v: string, ev: Event, data: GetDocumentsWithPage) => {
  if (v == 'rename') {
    document.value = data
    visible.value = true
  } else {
    handleDelete(data)
  }
}

/**
 * 处理文档删除操作
 * @param data - 要删除的文档对象
 */
const handleDelete = (data: GetDocumentsWithPage) => {
  // 显示删除确认对话框
  Modal.warning({
    title: '要删除该文档吗?', // 对话框标题
    content:
      '删除文档后，知识库/向量数据库将无法检索到该文档，如需暂时关闭该文档的检索，可以选择禁用功能。', // 删除警告内容
    hideCancel: false, // 显示取消按钮，允许用户取消操作
    titleAlign: 'start', // 标题左对齐显示
    simple: false, // 使用完整模式显示对话框
    modalClass: 'delete-modal',
    okText: '删除', // 确认按钮文本
    // 确认删除的回调函数
    onOk: async () => {
      try {
        // 开启加载状态
        loading.value = true
        // 调用API删除文档
        const resp = await DocumentsApi.deleteDocument(route.params.datasetId as string, data.id)
        // 显示删除结果消息
        Message.success(resp.message)
        // 如果删除成功，刷新文档列表
        if (resp.code == 'success') {
          await fetchDatasetById()
          await fetchData()
        }
      } catch (error) {
        // 错误处理：删除失败时的处理逻辑
        console.error('删除文档失败:', error)
      } finally {
        // 无论成功失败，都关闭加载状态
        loading.value = false
      }
    },
  })
}

/**
 * 处理召回测试按钮点击事件
 * @description 打开召回测试模态框，允许用户测试知识库的检索效果
 */
const handleHit = () => {
  hitVisible.value = true
}

/**
 * 处理召回测试模态框关闭事件
 * @description 在模态框关闭后，重新获取知识库信息和文档列表，确保数据同步
 */
const handleCloseHit = async () => {
  await fetchDatasetById()
  await fetchData()
}

/**
 * 处理表格行点击事件
 * @param row - 被点击的文档行数据，包含文档的详细信息
 * @description 当用户点击文档表格中的某一行时触发此函数。
 *              1. 将当前选中的文档信息存储到store中
 *              2. 使用Vue Router导航到文档分段页面
 *              3. 传递知识库ID和文档ID作为路由参数
 */
const handleRowClick = (row: GetDocumentsWithPage, ev: Event) => {
  // 将当前选中的文档信息存储到store中，以便其他组件可以访问
  store.document = row
  // 使用Vue Router导航到文档分段页面
  router.push({
    name: 'space-datasets-documents-segments', // 目标路由名称
    params: {
      datasetId: store.dataset?.id ?? route.params.datasetId, // 知识库ID，用于标识所属知识库
      documentId: row.id, // 文档ID，用于标识具体的文档
    },
  })
}

/**
 * 组件挂载时的生命周期钩子
 * @description 在组件挂载完成后，初始化加载知识库信息和文档列表数据
 */
onMounted(async () => {
  await fetchDatasetById()
  await fetchData()
})
</script>

<template>
  <div class="p-6 w-full h-full">
    <!-- 返回、标题、标签 -->
    <div class="flex items-center w-full gap-2 mb-6">
      <!-- 返回按钮 -->
      <RouterLink :to="{ name: 'space-datasets' }" replace>
        <a-button type="text" class="text-gray-700">
          <template #icon><icon-left /></template>
        </a-button>
      </RouterLink>
      <!-- 图标、标题、标签 -->
      <HeaderSkeleton :loading="loading" />
      <div v-if="!loading" class="flex items-center gap-3">
        <a-avatar
          :size="40"
          shape="square"
          class="rounded-lg"
          :image-url="store.dataset?.icon"
        ></a-avatar>
        <div class="flex flex-col justify-between h-[40px]">
          <div class="text-gray-700">知识库 / {{ dataset?.name }}</div>
          <div class="flex items-center gap-2">
            <a-tag size="small" class="rounded h-[18px] leading-[18px] bg-gray-200 text-gray-500"
              >{{ dataset?.document_count }} 文档</a-tag
            >
            <a-tag size="small" class="rounded h-[18px] leading-[18px] bg-gray-200 text-gray-500"
              >{{ dataset?.hit_count }} 命中</a-tag
            >
            <a-tag size="small" class="rounded h-[18px] leading-[18px] bg-gray-200 text-gray-500"
              >{{ dataset?.related_app_count }} 关联应用</a-tag
            >
          </div>
        </div>
      </div>
    </div>
    <!-- 搜索、召回测试、添加文件-->
    <div class="flex items-center w-full justify-between mb-6">
      <InputSearch
        placeholder="搜索文档"
        :search-word="searchWord"
        @update:searchWord="handleSearch"
      />
      <a-space :size="12">
        <a-button @click="handleHit" class="rounded-lg bg-white border-1 border-gray-200 text-black"
          >召回测试</a-button
        >
        <RouterLink
          :to="{
            name: 'space-datasets-documents-create',
            params: { datasetId: store.dataset?.id },
          }"
        >
          <a-button type="primary" class="rounded-lg">添加文件</a-button>
        </RouterLink>
      </a-space>
    </div>
    <!-- 表格内容 -->
    <DocumentTable
      :documents="documents"
      :pagination="pagination"
      :loading="loading"
      @page-change="handlePageChange"
      @select="handleSelect"
      @switch-change="handleSwitchChange"
      @row-click="handleRowClick"
    />
    <DocumentModal v-model:visible="visible" :document="document" :callback="fetchData" />
    <HitModal v-model="hitVisible" :closed="handleCloseHit" />
  </div>
</template>

<style scoped></style>
