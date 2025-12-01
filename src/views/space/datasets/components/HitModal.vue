<script setup lang="ts">
import DocumentsApi from '@/services/api/dataset/documents'
import type {
  DatasetHitReq,
  DatasetHitResp,
  GetDatasetQueriesResp,
} from '@/services/api/dataset/documents/type'
import type { UpdateSegmentReq } from '@/services/api/dataset/segments/types'
import { formatDate } from '@/utils/format-util'
import { Message } from '@arco-design/web-vue'
import { computed, ref, watch } from 'vue'
import { useDatasetStore } from '../DatasetView.store'
import SegmentModal from '../documents/segments/components/SegmentModal.vue'
import RetrievalModal from './RetrievalModal.vue'

/** 定义组件的props */
const props = defineProps<{ closed: () => void }>()
// 知识库状态管理store实例
const store = useDatasetStore()
// 控制模态框显示/隐藏的状态
const visible = defineModel({ type: Boolean, default: false })
// 控制检索设置模态框显示/隐藏的状态
const retrievalVisible = ref(false)
// 查询历史记录的加载状态
const queriesLoading = ref(false)
// 存储查询历史记录的数据
const datasetQueries = ref<GetDatasetQueriesResp[]>([])
// 检索操作的加载状态
const hitLoading = ref(false)
// 存储检索结果的数据
const hitSegments = ref<DatasetHitResp[]>([])
const segmentVisible = ref(false)
const selectSegment = ref<DatasetHitResp | null>()

// 默认检索设置配置
const defaultRetrievalSetting: DatasetHitReq = {
  query: '', // 查询文本
  retrieval_strategy: 'semantic', // 检索策略：语义检索
  k: 5, // 返回结果数量
  score: 0.5, // 相似度阈值
}

// 检索表单数据，基于默认设置初始化
const hitForm = ref<DatasetHitReq>({
  ...defaultRetrievalSetting,
})

// 根据检索策略类型返回对应的按钮名称
const btnName = computed(() => {
  if (hitForm.value.retrieval_strategy == 'hybrid') {
    return '混合策略' // 混合检索策略
  } else if (hitForm.value.retrieval_strategy == 'full_text') {
    return '全问检索' // 全文检索策略
  } else {
    return '相似性检索' // 默认语义检索策略
  }
})

/**
 * 获取知识库的检索数据列表
 * @returns {Promise<void>} 无返回值
 */
const handleHit = async () => {
  // 检查查询文本是否为空或只包含空白字符
  if (hitForm.value.query?.trim() === '') {
    // 如果为空，显示错误提示并返回
    Message.error('检索源文本不能为空')
    return
  }

  try {
    // 确保知识库存在且有有效的ID
    if (store.dataset && store.dataset.id) {
      // 设置加载状态为true，显示加载动画
      hitLoading.value = true
      // 调用API执行检索，传入知识库ID和检索参数
      const resp = await DocumentsApi.hitDataset(store.dataset?.id, hitForm.value)
      // 更新检索结果数据
      hitSegments.value = resp.data

      // 获取并更新查询历史记录
      await fetchQueries()
    }
  } catch (e) {
    // 捕获并处理可能出现的错误
  } finally {
    // 无论成功或失败，最后都要关闭加载状态
    hitLoading.value = false
  }
}

/**
 * 获取知识库的查询历史记录
 * @returns {Promise<void>} 无返回值
 */
const fetchQueries = async () => {
  try {
    // 检查知识库是否存在且有效
    if (store.dataset && store.dataset.id) {
      // 设置加载状态
      queriesLoading.value = true
      // 调用API获取查询历史
      const resp = await DocumentsApi.getDatasetQueries(store.dataset?.id)
      // 更新查询历史数据
      datasetQueries.value = resp.data
    }
  } catch (error) {
    // 错误处理
  } finally {
    // 无论成功失败，都重置加载状态
    queriesLoading.value = false
  }
}

/**
 * 处理模态框显示状态的更新
 * @param v 模态框的新显示状态
 * @description
 * 1. 更新模态框的显示状态
 * 2. 如果模态框关闭，清空选中的片段数据
 */
const handleUpdateVisible = (v: boolean) => {
  segmentVisible.value = v
  if (!v) {
    selectSegment.value = null
  }
}

/**
 * 处理片段更新成功的回调函数
 * @param {UpdateSegmentReq} value - 更新后的片段数据，包含内容和关键词
 * @description
 * 1. 关闭片段编辑模态框
 * 2. 检查是否有选中的片段且该片段存在ID
 * 3. 在检索结果中找到对应的片段
 * 4. 更新片段的内容和关键词
 */
const handleSuccess = (value: UpdateSegmentReq) => {
  // 关闭片段编辑模态框
  segmentVisible.value = false
  // 检查是否有选中的片段且该片段存在ID
  if (selectSegment.value && selectSegment.value.id) {
    // 在检索结果中找到对应的片段
    const segment = hitSegments.value.find((item) => item.id === selectSegment!.value!.id)
    // 如果找到对应的片段，更新其内容和关键词
    if (segment) {
      segment.content = value.content
      segment.keywords = value.keywords
    }
  }
}

/**
 * 处理选择片段的函数
 * @param segment - 选中的数据片段对象，包含片段的详细信息
 * @description
 * 1. 打开片段编辑模态框
 * 2. 将选中的片段数据存储到状态中
 */
const handleSelectSegment = (segment: DatasetHitResp) => {
  segmentVisible.value = true
  selectSegment.value = segment
}

/**
 * 关闭模态框处理函数
 * 执行以下操作：
 * 1. 关闭模态框显示
 * 2. 清空查询历史记录
 * 3. 清空检索结果
 * 4. 重置检索设置为默认值
 * 5. 调用父组件的closed方法，更新父组件数据
 */
const handleCloseModal = () => {
  visible.value = false
  datasetQueries.value = []
  hitSegments.value = []
  Object.assign(hitForm.value, { ...defaultRetrievalSetting })
  props.closed()
}

/**
 * 关闭检索设置模态框时的处理函数
 * 将检索设置重置为默认值
 */
const closeRetrieval = () => {
  Object.assign(hitForm.value, { ...defaultRetrievalSetting })
}

/**
 * 提交检索设置时的处理函数
 * 清空当前的检索结果，为新的检索做准备
 */
const submitRetrieval = () => {
  hitSegments.value = []
}

/**
 * 处理检索设置按钮点击事件
 * 打开检索设置模态框，允许用户配置检索参数
 */
const handleRetrievalClick = () => {
  retrievalVisible.value = true
}

/**
 * 处理查询历史记录点击事件
 * @param {string} query - 选中的查询文本
 * 将选中的查询文本设置到检索表单中
 */
const handleQueryClick = (query: string) => {
  hitForm.value.query = query
}

/**
 * 监听模态框可见性变化
 * 当模态框打开时，自动获取查询历史记录
 */
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
        <div class="flex flex-1">
          <a-spin :loading="hitLoading" class="w-full h-full">
            <a-row
              v-if="hitSegments.length > 0"
              class="h-max-[690px] overflow-y-auto"
              :gutter="[16, 16]"
            >
              <a-col v-for="segment in hitSegments" :key="segment.id" :span="12">
                <div
                  class="p-4 bg-gray-50 rounded-lg cursor-pointer"
                  @click="handleSelectSegment(segment)"
                >
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
            <a-empty v-else class="mt-10" />
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
    <SegmentModal
      v-model:visible="segmentVisible"
      :segment="selectSegment"
      @update:visible="handleUpdateVisible"
      @success="handleSuccess"
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
