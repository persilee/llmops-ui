<script setup lang="ts">
import { formatDate } from '@/utils/format-util'
import { ref } from 'vue'
import RetrievalModal from './RetrievalModal.vue'

const visible = defineModel({ type: Boolean, default: false })
const retrievalVisible = ref(false)

const handleCloseModal = () => {
  visible.value = false
}

const handleRetrievalClick = () => {
  retrievalVisible.value = true
}

const data = [
  {
    created_at: 1763336248,
    dataset_id: 'a72fb5a8-e8b5-4141-9a56-2f8b17407371',
    id: 'b730fb89-8020-440d-bb5a-80bb0ac33a6d',
    query: 'Users',
    source: 'hit_testing',
  },
  {
    created_at: 1763336248,
    dataset_id: 'a72fb5a8-e8b5-4141-9a56-2f8b17407371',
    id: '4557109c-5be2-419c-a282-b827e2f363ea',
    query: 'Users',
    source: 'hit_testing',
  },
  {
    created_at: 1763336248,
    dataset_id: 'a72fb5a8-e8b5-4141-9a56-2f8b17407371',
    id: '7ac2c0cb-02da-40c3-bca8-14348b520098',
    query: 'Users',
    source: 'hit_testing',
  },
  {
    created_at: 1763336248,
    dataset_id: 'a72fb5a8-e8b5-4141-9a56-2f8b17407371',
    id: 'b730fb89-8020-440d-bb5a-80bb0ac33a6d',
    query: 'Users',
    source: 'hit_testing',
  },
  {
    created_at: 1763336248,
    dataset_id: 'a72fb5a8-e8b5-4141-9a56-2f8b17407371',
    id: '4557109c-5be2-419c-a282-b827e2f363ea',
    query: 'Users',
    source: 'hit_testing',
  },
  {
    created_at: 1763336248,
    dataset_id: 'a72fb5a8-e8b5-4141-9a56-2f8b17407371',
    id: '7ac2c0cb-02da-40c3-bca8-14348b520098',
    query: 'Users',
    source: 'hit_testing',
  },
  {
    created_at: 1763336248,
    dataset_id: 'a72fb5a8-e8b5-4141-9a56-2f8b17407371',
    id: 'b730fb89-8020-440d-bb5a-80bb0ac33a6d',
    query: 'Users',
    source: 'hit_testing',
  },
  {
    created_at: 1763336248,
    dataset_id: 'a72fb5a8-e8b5-4141-9a56-2f8b17407371',
    id: '4557109c-5be2-419c-a282-b827e2f363ea',
    query: 'Users',
    source: 'hit_testing',
  },
  {
    created_at: 1763336248,
    dataset_id: 'a72fb5a8-e8b5-4141-9a56-2f8b17407371',
    id: '7ac2c0cb-02da-40c3-bca8-14348b520098',
    query: 'Users',
    source: 'hit_testing',
  },
  {
    created_at: 1763336248,
    dataset_id: 'a72fb5a8-e8b5-4141-9a56-2f8b17407371',
    id: '4557109c-5be2-419c-a282-b827e2f363ea',
    query: 'Users',
    source: 'hit_testing',
  },
  {
    created_at: 1763336248,
    dataset_id: 'a72fb5a8-e8b5-4141-9a56-2f8b17407371',
    id: '7ac2c0cb-02da-40c3-bca8-14348b520098',
    query: 'Users',
    source: 'hit_testing',
  },
  {
    created_at: 1763336248,
    dataset_id: 'a72fb5a8-e8b5-4141-9a56-2f8b17407371',
    id: '4557109c-5be2-419c-a282-b827e2f363ea',
    query: 'Users',
    source: 'hit_testing',
  },
  {
    created_at: 1763336248,
    dataset_id: 'a72fb5a8-e8b5-4141-9a56-2f8b17407371',
    id: '7ac2c0cb-02da-40c3-bca8-14348b520098',
    query: 'Users',
    source: 'hit_testing',
  },
]
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
                向量检索
              </a-button>
            </div>
            <!-- 输入框 -->
            <div class="flex flex-1 flex-col bg-white rounded-xl py-2">
              <a-textarea
                class="flex-1 bg-transparent rounded-xl focus-within:border-0 not-focus-within: border-0"
                placeholder="请输入文本，建议使用简短的陈述句"
                :max-length="200"
                :auto-size="{ minRows: 6, maxRows: 6 }"
              />
              <div class="flex items-center justify-between px-4">
                <a-tag class="text-gray-500 rounded-md">0 / 200</a-tag>
                <a-button type="primary" size="small">测试</a-button>
              </div>
            </div>
          </div>
          <!-- 最近查询 -->
          <div class="flex flex-col mt-6">
            <div class="text-gray-700 font-bold mb-4 text-base">最近查询</div>
            <a-table
              :data="data"
              :pagination="false"
              size="small"
              :bordered="{ wrapper: false }"
              :scroll="{ y: '340px' }"
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
        <div class="flex-1">
          <a-row class="h-[690px] overflow-y-auto" :gutter="[16, 16]">
            <a-col v-for="n in 16" :key="n" :span="12">
              <div class="p-4 bg-gray-50 rounded-lg cursor-pointer">
                <!-- 评分 -->
                <div class="flex items-center gap-2 mb-1.5">
                  <img src="@/assets/images/icon-score.png" class="w-3 h-3" />
                  <a-progress
                    :stroke-width="6"
                    :show-text="false"
                    :percent="0.46"
                    color="#CCCCCC"
                  />
                  <div class="text-gray-500 text-xs font-bold">0.46</div>
                </div>
                <!-- 内容 -->
                <div class="text-gray-700 line-clamp-4">
                  ## 角色
                  你是一个拥有10年经验的资深Python工程师，精通Flask/SQLAlchemy等，能熟练使用各类IDE及调试工具
                </div>
                <!-- 文件名 -->
                <a-divider class="my-2" />
                <div class="flex items-center gap-2 text-gray-500 text-xs">
                  <img src="@/assets/images/icon-file.png" class="w-3 h-3" />
                  <div class="line-clamp-1">requirements.txt</div>
                </div>
              </div>
            </a-col>
          </a-row>
        </div>
      </div>
    </div>
    <RetrievalModal v-model:visible="retrievalVisible" />
  </a-modal>
</template>

<style scoped>
:deep(.arco-table-size-small .arco-table-cell) {
  padding: 5px 10px 5px 0px;
}

:deep(.arco-table-header) {
  background-color: transparent;
}
</style>
