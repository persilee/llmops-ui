<script setup lang="ts">
import DocumentsApi from '@/services/api/dataset/documents'
import type { GetDocumentsWithPage } from '@/services/api/dataset/documents/type'
import { formatDate } from '@/utils/format-util'
import InputSearch from '@/views/components/InputSearch.vue'
import { debounce } from 'lodash-es'
import { onMounted, reactive, ref } from 'vue'
import { useDatasetStore } from '../DatasetView.store'

const store = useDatasetStore()
const loading = ref(false)
const documents = ref<GetDocumentsWithPage[]>([])
const pagination = reactive({
  total: 0,
  current: 1,
  defaultCurrent: 1,
  pageSize: 5,
  defaultPageSize: 5,
  showTotal: true,
})

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

const debouncedFetchData = debounce(fetchData, 300)

const handleSearch = (value: string) => {
  store.searchWord = value
  pagination.current = 1
  debouncedFetchData()
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
    <div class="">
      <a-table
        hoverable
        :data="documents"
        :pagination="pagination"
        :bordered="{ wrapper: false }"
        @page-change="handlePageChange"
        :loading="loading"
      >
        <template #columns>
          <a-table-column
            title="#"
            data-index="position"
            :width="60"
            header-cell-class="rounded-tl-lg bg-gray-200 text-gray-700"
            body-cell-class="bg-transparent"
          />
          <a-table-column
            title="文档名"
            data-index="name"
            :width="400"
            header-cell-class="bg-gray-200 text-gray-700"
            body-cell-class="bg-transparent"
          >
            <template #cell="{ record }">
              <div class="line-clamp-1">{{ record.name }}</div>
            </template>
          </a-table-column>
          <a-table-column
            title="字符集"
            data-index="character_count"
            header-cell-class=" bg-gray-200 text-gray-700"
            body-cell-class="bg-transparent"
          >
            <template #cell="{ record }">
              {{ (record.character_count / 1000).toFixed(1) }}k
            </template>
          </a-table-column>
          <a-table-column
            title="召回次数"
            data-index="hit_count"
            header-cell-class="bg-gray-200 text-gray-700"
            body-cell-class="bg-transparent"
          />
          <a-table-column
            title="上传时间"
            data-index="created_at"
            header-cell-class="bg-gray-200 text-gray-700"
            body-cell-class="bg-transparent"
          >
            <template #cell="{ record }">
              {{ formatDate(record.created_at, 'YYYY-MM-DD HH:mm:ss') }}
            </template>
          </a-table-column>
          <a-table-column
            title="状态"
            data-index="status"
            header-cell-class="bg-gray-200 text-gray-700"
            body-cell-class="bg-transparent"
          >
            <template #cell="{ record }">
              <a-space>
                <a-badge v-if="record.enabled" status="success" text="可用" />
                <a-badge v-else status="normal" text="已禁用" />
              </a-space>
            </template>
          </a-table-column>
          <a-table-column
            title="操作"
            data-index="operator"
            header-cell-class="rounded-tr-lg bg-gray-200 text-gray-700"
            body-cell-class="bg-transparent"
            :width="100"
          >
            <template #cell="{ record }">
              <a-space :size="0">
                <template #split>
                  <a-divider direction="vertical" />
                </template>
                <a-switch size="small" type="round" :checked-value="!record.enabled"></a-switch>
                <a-dropdown position="br">
                  <a-button type="text" size="mini" class="text-gray-700">
                    <template #icon><icon-more /></template>
                  </a-button>
                  <template #content>
                    <a-doption>重命名</a-doption>
                    <a-doption class="text-red-700">删除</a-doption>
                  </template>
                </a-dropdown>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>
  </div>
</template>

<style scoped></style>
