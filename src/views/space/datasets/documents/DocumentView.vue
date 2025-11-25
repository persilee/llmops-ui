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

const store = useDatasetStore()
const loading = ref(false)
const documents = ref<GetDocumentsWithPage[]>([])
const document = ref<GetDocumentsWithPage | null>(null)
const pagination = reactive({
  total: 0,
  current: 1,
  defaultCurrent: 1,
  pageSize: 20,
  defaultPageSize: 20,
  showTotal: true,
})
const visible = ref(false)

const fetchData = async () => {
  try {
    loading.value = true
    if (store.dataset) {
      const resp = await DocumentsApi.getDocumentsWithPage(store.dataset.id, {
        current_page: pagination.current,
        page_size: pagination.pageSize,
        search_word: store.searchWord,
      })
      documents.value = resp.data.list
      pagination.total = resp.data.paginator.total_record
    }
  } catch (error) {
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  pagination.current = page
  fetchData()
}

const handleSwitchChange = async (v: boolean, document: GetDocumentsWithPage) => {
  try {
    if (store.dataset && store.dataset.id) {
      loading.value = true
      const resp = await DocumentsApi.updateDocumentEnabled(store.dataset.id, document.id, {
        enabled: v,
      })
      if (resp.code == 'success') {
        Message.success(resp.message)
      }
      fetchData()
    }
  } catch (error) {
    document.enabled = !v
  } finally {
    loading.value = false
  }
}

const debouncedFetchData = debounce(fetchData, 300)

const handleSearch = (value: string) => {
  store.searchWord = value
  pagination.current = 1
  debouncedFetchData()
}

const handleSelect = (v: string, data: GetDocumentsWithPage) => {
  if (v == 'rename') {
    document.value = data
    visible.value = true
  } else {
    handleDelete(data)
  }
}

const handleDelete = (data: GetDocumentsWithPage) => {
  Modal.warning({
    title: '要删除该文档吗?', // 模态框标题
    content:
      '删除文档后，知识库/向量数据库将无法检索到该文档，如需暂时关闭该文档的检索，可以选择禁用功能。', // 提示内容
    hideCancel: false, // 显示取消按钮
    titleAlign: 'start', // 标题左对齐
    simple: false, // 简单模式
    // 确认按钮的回调函数
    onOk: async () => {
      try {
        if (store.dataset && store.dataset.id) {
          loading.value = true
          const resp = await DocumentsApi.deleteDocument(store.dataset.id, data.id)
          Message.success(resp.message)
          if (resp.code == 'success') {
            fetchData()
          }
        }
      } catch (error) {
      } finally {
        loading.value = false
      }
    },
    onCancel: () => {
      // 取消删除操作
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
