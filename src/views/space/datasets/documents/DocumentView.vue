<script setup lang="ts">
import DocumentsApi from '@/services/api/dataset/documents'
import type { GetDocumentsWithPage } from '@/services/api/dataset/documents/type'
import InputSearch from '@/views/components/InputSearch.vue'
import { Message, Modal } from '@arco-design/web-vue'
import { debounce } from 'lodash-es'
import { onMounted, reactive, ref } from 'vue'
import { useDatasetStore } from '../DatasetView.store'
import DocumentModal from '../components/DocumentModal.vue'
import DocumentTable from '../components/DocumentTable.vue'

// 使用数据集状态管理store
const store = useDatasetStore()
// 加载状态，用于控制表格加载动画
const loading = ref(false)
// 文档列表数据，类型为GetDocumentsWithPage数组
const documents = ref<GetDocumentsWithPage[]>([])
// 当前选中的文档对象，用于编辑操作
const document = ref<GetDocumentsWithPage | null>(null)
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

/**
 * 获取文档列表数据
 * @description 从服务器获取分页的文档列表数据，并更新本地状态
 */
const fetchData = async () => {
  try {
    // 开启加载状态
    loading.value = true
    // 确保数据集存在
    if (store.dataset) {
      // 调用API获取文档列表
      const resp = await DocumentsApi.getDocumentsWithPage(store.dataset.id, {
        current_page: pagination.current, // 当前页码
        page_size: pagination.pageSize, // 每页条数
        search_word: store.searchWord, // 搜索关键词
      })
      // 更新文档列表数据
      documents.value = resp.data.list
      // 更新分页总条数
      pagination.total = resp.data.paginator.total_record
    }
  } catch (error) {
    // 错误处理
    console.error('获取文档列表失败:', error)
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
const handleSwitchChange = async (v: boolean, document: GetDocumentsWithPage) => {
  try {
    // 确保数据集存在
    if (store.dataset && store.dataset.id) {
      // 开启加载状态
      loading.value = true
      // 调用API更新文档启用状态
      const resp = await DocumentsApi.updateDocumentEnabled(store.dataset.id, document.id, {
        enabled: v,
      })
      // 如果更新成功，显示成功消息
      if (resp.code == 'success') {
        Message.success(resp.message)
      }
      // 重新获取文档列表数据
      fetchData()
    }
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
  store.searchWord = value
  pagination.current = 1
  debouncedFetchData()
}

/**
 * 处理文档选择操作
 * @param v - 操作类型，'rename'表示重命名，其他值表示删除
 * @param data - 被选中的文档对象
 * @description 根据操作类型执行重命名或删除文档的操作
 */
const handleSelect = (v: string, data: GetDocumentsWithPage) => {
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

    // 确认删除的回调函数
    onOk: async () => {
      try {
        // 确保数据集存在
        if (store.dataset && store.dataset.id) {
          // 开启加载状态
          loading.value = true
          // 调用API删除文档
          const resp = await DocumentsApi.deleteDocument(store.dataset.id, data.id)
          // 显示删除结果消息
          Message.success(resp.message)
          // 如果删除成功，刷新文档列表
          if (resp.code == 'success') {
            fetchData()
          }
        }
      } catch (error) {
        // 错误处理：删除失败时的处理逻辑
        console.error('删除文档失败:', error)
      } finally {
        // 无论成功失败，都关闭加载状态
        loading.value = false
      }
    },

    // 取消删除的回调函数
    onCancel: () => {
      // 用户取消删除操作
      console.log('取消删除')
    },
  })
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="p-6">
    <!-- 返回、标题、标签 -->
    <div class="flex items-center w-full gap-2 mb-6">
      <!-- 返回按钮 -->
      <RouterLink :to="{ name: 'space-datasets' }">
        <a-button size="mini" type="text" class="text-gray-700">
          <template #icon><icon-left /></template>
        </a-button>
      </RouterLink>
      <!-- 图标、标题、标签 -->
      <div class="flex items-center gap-3">
        <a-avatar
          :size="40"
          shape="square"
          class="rounded-lg"
          :image-url="store.dataset?.icon"
        ></a-avatar>
        <div class="flex flex-col justify-between h-[40px]">
          <div class="text-gray-700">知识库 / {{ store.dataset?.name }}</div>
          <div class="flex items-center gap-2">
            <a-tag size="small" class="rounded h-[18px] leading-[18px] bg-gray-200 text-gray-500"
              >{{ store.dataset?.document_count }} 文档</a-tag
            >
            <a-tag size="small" class="rounded h-[18px] leading-[18px] bg-gray-200 text-gray-500"
              >{{ store.dataset?.hit_count }} 命中</a-tag
            >
            <a-tag size="small" class="rounded h-[18px] leading-[18px] bg-gray-200 text-gray-500"
              >{{ store.dataset?.related_app_count }} 关联应用</a-tag
            >
          </div>
        </div>
      </div>
    </div>
    <!-- 搜索、召回测试、添加文件-->
    <div class="flex items-center w-full justify-between mb-6">
      <InputSearch
        placeholder="搜索文档"
        :search-word="store.searchWord"
        @update:searchWord="handleSearch"
      />
      <a-space :size="12">
        <a-button class="rounded-lg bg-white border-1 border-gray-200 text-black"
          >召回测试</a-button
        >
        <a-button type="primary" class="rounded-lg">添加文件</a-button>
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
    />
    <DocumentModal v-model:visible="visible" :document="document" :callback="fetchData" />
  </div>
</template>

<style scoped></style>
