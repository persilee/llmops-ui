<script setup lang="ts">
import DocumentsApi from '@/services/api/dataset/documents'
import type {
  DatasetHitReq,
  DatasetHitResp,
  GetDatasetQueriesResp,
} from '@/services/api/dataset/documents/type'
import { formatDate } from '@/utils/format-util'
import { Message } from '@arco-design/web-vue'
import { computed, ref, watch } from 'vue'
import { useDatasetStore } from '../DatasetView.store'
import RetrievalModal from './RetrievalModal.vue'

const store = useDatasetStore()
const visible = defineModel({ type: Boolean, default: false })
const retrievalVisible = ref(false)
const queriesLoading = ref(false)
const datasetQueries = ref<GetDatasetQueriesResp[]>([])
const hitLoading = ref(false)
const hitSegments = ref<DatasetHitResp[]>([])

const defaultRetrievalSetting: DatasetHitReq = {
  query: '',
  retrieval_strategy: 'semantic',
  k: 5,
  score: 0.5,
}

const hitForm = ref<DatasetHitReq>({
  ...defaultRetrievalSetting,
})

const btnName = computed(() => {
  if (hitForm.value.retrieval_strategy == 'hybrid') {
    return '混合策略'
  } else if (hitForm.value.retrieval_strategy == 'full_text') {
    return '全问检索'
  } else {
    return '相似性检索'
  }
})

const handleHit = async () => {
  if (hitForm.value.query?.trim() === '') {
    Message.error('检索源文本不能为空')
    return
  }

  try {
    if (store.dataset && store.dataset.id) {
      hitLoading.value = true
      const resp = await DocumentsApi.hitDataset(store.dataset?.id, hitForm.value)
      hitSegments.value = resp.data

      await fetchQueries()
    }
  } catch (e) {
  } finally {
    hitLoading.value = false
  }
}

const fetchQueries = async () => {
  try {
    if (store.dataset && store.dataset.id) {
      queriesLoading.value = true
      const resp = await DocumentsApi.getDatasetQueries(store.dataset?.id)
      datasetQueries.value = resp.data
    }
  } catch (error) {
  } finally {
    queriesLoading.value = false
  }
}

const handleCloseModal = () => {
  visible.value = false
  datasetQueries.value = []
  hitSegments.value = []
  Object.assign(hitForm.value, { ...defaultRetrievalSetting })
}

const closeRetrieval = () => {
  Object.assign(hitForm.value, { ...defaultRetrievalSetting })
}

const submitRetrieval = () => {
  hitSegments.value = []
}

const handleRetrievalClick = () => {
  retrievalVisible.value = true
}

const handleQueryClick = (query: string) => {
  hitForm.value.query = query
}

watch(
  () => visible.value,
  (val) => {
    if (val) {
      fetchQueries()
    }
  },
)
</script>

<template>
  <a-modal
    :visible="visible"
    hide-title
    modal-class="rounded-xl w-2/3 min-w-[800px] h-[800px]"
    body-class="p-0 h-full"
    :footer="false"
    @cancel="handleCloseModal"
  >
    <div class="px-5 h-full">
      <!-- 标题 -->
      <div class="flex flex-col">
        <div class="flex items-center justify-between pt-3 pb-1">
          <div class="text-black font-bold text-xl">召回测试</div>
          <a-button type="text" size="mini" class="rounded-full" @click="handleCloseModal">
            <template #icon>
              <icon-close class="text-gray-800 font-bold" />
            </template>
          </a-button>
        </div>
        <div class="text-gray-400">基于给定的查询文本测试知识库的召回效果</div>
      </div>
      <!-- 模态框内容 -->
      <div class="flex mt-5">
        <!-- 左边内容 -->
        <div class="flex flex-1 flex-col">
          <!-- 源文本框 -->
          <div class="flex flex-col w-full h-[280px] bg-blue-50 border border-blue-700 rounded-xl">
            <!-- 标题和按钮 -->
            <div class="flex items-center justify-between px-4 py-2">
              <div class="text-black text-sm font-bold">源文本</div>
              <a-button
                type="outline"
                class="bg-white rounded-lg border-gray-300 text-gray-900"
                @click="handleRetrievalClick"
                size="small"
              >
                <template #icon>
                  <icon-language />
                </template>
                {{ btnName }}
              </a-button>
            </div>
            <!-- 输入框 -->
            <div class="flex flex-1 flex-col bg-white rounded-xl py-2">
              <a-textarea
                v-model="hitForm.query"
                class="flex-1 bg-transparent rounded-xl focus-within:border-0 not-focus-within: border-0"
                placeholder="请输入文本，建议使用简短的陈述句"
                :max-length="200"
                :auto-size="{ minRows: 6, maxRows: 6 }"
              />
              <div class="flex items-center justify-between px-4">
                <a-tag class="text-gray-500 rounded-md"
                  >{{ hitForm.query?.length ?? 0 }} / 200</a-tag
                >
                <a-button :loading="hitLoading" type="primary" size="small" @click="handleHit"
                  >测试</a-button
                >
              </div>
            </div>
          </div>
          <!-- 最近查询 -->
          <div class="flex flex-col mt-6">
            <div class="text-gray-700 font-bold mb-4 text-base">最近查询</div>
            <a-table
              :data="datasetQueries"
              :pagination="false"
              size="small"
              :bordered="{ wrapper: false }"
              :scroll="{ y: '340px' }"
              :loading="queriesLoading"
              @row-click="(record: GetDatasetQueriesResp) => handleQueryClick(record.query)"
            >
              <template #columns>
                <a-table-column
                  class="b-0"
                  title="数据源"
                  data-index="source"
                  header-cell-class="text-gray-700 bg-transparent border-0 font-bold"
                  body-cell-class="text-gran-500"
                  :width="110"
                />
                <a-table-column
                  title="文本"
                  data-index="query"
                  header-cell-class="text-gray-700 bg-transparent border-0 font-bold"
                  body-cell-class="text-gran-500"
                >
                  <template #cell="{ record }">
                    <div class="line-clamp-1">{{ record.query }}</div>
                  </template>
                </a-table-column>
                <a-table-column
                  title="时间"
                  data-index=" created_at"
                  header-cell-class="text-gray-700 bg-transparent border-0 font-bold"
                  body-cell-class="text-gran-500"
                  :width="160"
                >
                  <template #cell="{ record }">
                    <div class="line-clamp-1">
                      {{ formatDate(record.created_at, 'YYYY-MM-DD HH:mm') }}
                    </div>
                  </template>
                </a-table-column>
              </template>
            </a-table>
          </div>
        </div>
        <!-- 中间竖线 -->
        <a-divider direction="vertical" class="mx-5" />
        <!-- 右边内容 -->
        <div class="flex flex-1 items-center justify-center">
          <a-spin :loading="hitLoading">
            <a-row
              v-if="hitSegments.length > 0"
              class="h-[690px] overflow-y-auto"
              :gutter="[16, 16]"
            >
              <a-col v-for="segment in hitSegments" :key="segment.id" :span="12">
                <div class="p-4 bg-gray-50 rounded-lg cursor-pointer">
                  <!-- 评分 -->
                  <div
                    v-if="hitForm.retrieval_strategy == 'semantic'"
                    class="flex items-center gap-2 mb-1.5"
                  >
                    <img src="@/assets/images/icon-score.png" class="w-3 h-3" />
                    <a-progress
                      :stroke-width="6"
                      :show-text="false"
                      :percent="segment.score"
                      color="#CCCCCC"
                    />
                    <div class="text-gray-500 text-xs font-bold">
                      {{ segment.score.toFixed(2) }}
                    </div>
                  </div>
                  <!-- 内容 -->
                  <div class="text-gray-700 line-clamp-4 h-[88px] break-all">
                    {{ segment.content }}
                  </div>
                  <!-- 文件名 -->
                  <a-divider class="my-2" />
                  <div class="flex items-center gap-2 text-gray-500 text-xs">
                    <img src="@/assets/images/icon-file.png" class="w-3 h-3" />
                    <div class="line-clamp-1">{{ segment.document.name }}</div>
                  </div>
                </div>
              </a-col>
            </a-row>
            <a-empty v-else />
          </a-spin>
        </div>
      </div>
    </div>
    <RetrievalModal
      v-model:visible="retrievalVisible"
      v-model:retrieval-setting="hitForm"
      @close="closeRetrieval"
      @submit="submitRetrieval"
    />
  </a-modal>
</template>

<style scoped>
:deep(.arco-table-size-small .arco-table-cell) {
  padding: 5px 10px 5px 0px;
}

:deep(.arco-table-header) {
  background-color: transparent;
}

:deep(.arco-table-td) {
  border-bottom: none;
}
</style>
