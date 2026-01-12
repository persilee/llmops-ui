<script setup lang="ts">
import { useVueFlow } from '@vue-flow/core'
import { cloneDeep, isEqual } from 'lodash'
import { computed, onMounted, ref, watch, type PropType } from 'vue'

import type { Dataset } from '@/services/api/apps/types'
import { type TextareaInstance } from '@arco-design/web-vue'
import { useWorkflowStore } from '../../Workflow.store'
import AddDatasetModal from './AddDatasetModal.vue'

// 1.定义自定义组件所需数据
const props = defineProps({
  node: {
    type: Object as PropType<Record<string, any>> | null,
    default: () => {},
  },
})
const visible = defineModel('visible', { type: Boolean, default: false })
const emits = defineEmits(['updateNode', 'closeNodeInfo'])
const datasetsModalVisible = ref(false)
const form = ref<Record<string, any>>({})
const { nodes, edges } = useVueFlow()
const store = useWorkflowStore()
const descriptionVisible = ref(false)
const descriptionRef = ref<TextareaInstance | null>(null)

// 2.定义节点可引用的变量选项
const inputRefOptions = computed(() => {
  return store.getReferencedVariables(cloneDeep(nodes.value), cloneDeep(edges.value), props.node.id)
})

// 4.定义取消关联知识库函数
const removeDataset = (idx: number) => {
  form.value.datasets.splice(idx, 1)
  handleUpdateNodeInfo()
}

const updateNodeDatasets = (datasets: Dataset[]) => {
  form.value.datasets = datasets
  handleUpdateNodeInfo()
}

const handleClickDescription = () => {
  descriptionVisible.value = true
  setTimeout(() => {
    descriptionRef.value?.focus()
  }, 160)
}

const nodeToFrom = (newNode: any) => {
  const cloneInputs = cloneDeep(newNode.data.inputs)
  return {
    id: newNode.id,
    type: newNode.type,
    title: newNode.data.title,
    description:
      newNode.data.description == ''
        ? '根据输入的参数，在选定的知识库中检索相关片段并召回，返回切片列表'
        : newNode.data.description,
    datasets: cloneDeep(newNode.data.meta.datasets) ?? [],
    retrieval_config: cloneDeep(newNode.data.retrieval_config) ?? {
      k: 4,
      retrieval_strategy: 'semantic',
      score: 0,
    },
    inputs: cloneInputs.map((input: any) => {
      // 7.1 计算引用的变量值信息
      const ref =
        input.value.type === 'ref'
          ? `${input.value.content.ref_node_id}/${input.value.content.ref_var_name}`
          : ''

      // 7.2 判断引用的变量值信息是否存在，如果不存在则设置为空
      let refExists = false
      if (input.value.type === 'ref') {
        for (const inputRefOption of inputRefOptions.value) {
          for (const option of inputRefOption.options) {
            if (option.value === ref) {
              refExists = true
              break
            }
          }
        }
      }
      return {
        name: input.name, // 变量名
        type: input.value.type === 'literal' ? input.type : 'ref', // 数据类型(涵盖ref/string/int/float/boolean
        content: input.value.type === 'literal' ? input.value.content : '', // 变量值内容
        ref: input.value.type === 'ref' && refExists ? ref : '', // 变量引用信息，存储引用节点id+引用变量名
      }
    }),
    outputs: [
      { name: 'combine_documents', type: 'string', value: { type: 'generated', content: '' } },
    ],
  }
}

const handleUpdateDesc = () => {
  descriptionVisible.value = false
  handleUpdateNodeInfo()
}

const handleUpdateNodeInfo = () => {
  const node = nodeToFrom(props.node)
  if (isEqual(node, form.value)) return

  const cloneInputs = cloneDeep(form.value.inputs)
  const cloneDatasets = cloneDeep(form.value.datasets)

  emits('updateNode', {
    id: props.node.id,
    title: form.value.title,
    description: form.value.description,
    dataset_ids: cloneDatasets.map((dataset: any) => {
      return dataset.id
    }),
    meta: { datasets: cloneDatasets },
    retrieval_config: cloneDeep(form.value.retrieval_config),
    inputs: cloneInputs.map((input: any) => {
      return {
        name: input.name,
        description: '',
        required: true,
        type: input.type === 'ref' ? 'string' : input.type,
        value: {
          type: input.type === 'ref' ? 'ref' : 'literal',
          content:
            input.type === 'ref'
              ? {
                  ref_node_id: input.ref.split('/')[0] || '',
                  ref_var_name: input.ref.split('/')[1] || '',
                }
              : input.content,
        },
        meta: {},
      }
    }),
    outputs: cloneDeep(form.value.outputs),
  })
}

watch(
  () => props.node,
  (newNode) => {
    if (!newNode) return
    form.value = nodeToFrom(newNode)
  },
  { immediate: true },
)
onMounted(() => {})
</script>

<template>
  <div v-if="visible" class="absolute right-0 top-0 bottom-0 w-[400px] p-2.5 node-info">
    <div
      class="flex flex-col h-full bg-white z-50 p-4 border border-gray-100 shadow-lg rounded-lg relative"
      @click.stop
    >
      <div class="flow-node-info__bg w-full h-[120px] absolute top-0 left-0 rounded-xl z-0"></div>
      <div class="z-10">
        <!-- 顶部标题信息 -->
        <div class="flex items-center justify-between gap-3 mb-2">
          <!-- 左侧标题 -->
          <div class="flex items-center gap-1 flex-1">
            <a-avatar :size="26" shape="square" class="bg-violet-500 rounded-lg flex-shrink-0">
              <icon-storage />
            </a-avatar>
            <a-input
              v-model="form.title"
              placeholder="请输入标题"
              class="text-gray-700 font-semibold px-2 bg-transparent"
              @blur="handleUpdateNodeInfo"
            />
          </div>
          <!-- 右侧关闭按钮 -->
          <a-button
            type="text"
            size="mini"
            class="rounded-full bg-transparent hover:shadow-sm"
            @click="emits('closeNodeInfo')"
          >
            <template #icon>
              <icon-close class="text-gray-800 font-bold" />
            </template>
          </a-button>
        </div>
        <!-- 描述信息 -->
        <a-textarea
          ref="descriptionRef"
          v-show="descriptionVisible"
          :auto-size="{ minRows: 3, maxRows: 5 }"
          v-model="form.description"
          class="rounded-lg bg-transparent"
          placeholder="输入描述..."
          @blur="handleUpdateDesc"
        />
        <div
          v-show="!descriptionVisible"
          class="text-xs text-gray-500"
          @click="handleClickDescription"
        >
          {{ form.description }}
        </div>
        <!-- 分隔符 -->
        <a-divider class="my-3.5" />
        <!-- 表单信息 -->
        <a-form size="mini" :model="form" layout="vertical">
          <!-- 输入参数 -->
          <div class="flex flex-col gap-2">
            <!-- 标题&操作按钮 -->
            <div class="flex items-center justify-between">
              <!-- 左侧标题 -->
              <div class="flex items-center gap-2 text-gray-700 font-semibold">
                <div class="">输入数据</div>
                <a-tooltip
                  content="输入给大模型的参数，可在下方提示词中引用。所有输入参数会被转为string输入。"
                >
                  <icon-question-circle />
                </a-tooltip>
              </div>
            </div>
            <!-- 字段名 -->
            <div class="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <div class="w-[20%]">参数名</div>
              <div class="w-[25%]">类型</div>
              <div class="w-[55%]">值</div>
            </div>
            <!-- 循环遍历字段列表 -->
            <div v-for="(input, idx) in form?.inputs" :key="idx" class="flex items-center gap-1">
              <div class="w-[20%] flex-shrink-0">
                <div class="text-xs text-gray-500">{{ input.name }}</div>
              </div>
              <div class="w-[25%] flex-shrink-0">
                <a-select
                  size="mini"
                  v-model="input.type"
                  class="px-2"
                  @change="handleUpdateNodeInfo"
                  :options="[
                    { label: '引用', value: 'ref' },
                    { label: 'STRING', value: 'string' },
                    { label: 'INT', value: 'int' },
                    { label: 'FLOAT', value: 'float' },
                    { label: 'BOOLEAN', value: 'boolean' },
                  ]"
                />
              </div>
              <div class="w-[55%] flex-shrink-0 flex items-center gap-1">
                <a-input
                  v-if="input.type !== 'ref'"
                  size="mini"
                  v-model="input.content"
                  placeholder="请输入参数值"
                  @blur="handleUpdateNodeInfo"
                />
                <a-select
                  v-else
                  placeholder="请选择引用变量"
                  size="mini"
                  tag-nowrap
                  v-model="input.ref"
                  @change="handleUpdateNodeInfo"
                  :options="inputRefOptions"
                />
              </div>
            </div>
          </div>
          <a-divider class="my-4" />
          <!-- 检索策略 -->
          <div class="flex flex-col gap-2">
            <!-- 标题&操作按钮 -->
            <div class="flex items-center justify-between">
              <!-- 左侧标题 -->
              <div class="flex items-center gap-2 text-gray-700 font-semibold">
                <div class="">检索设置</div>
                <a-tooltip content="配置知识库的检索规则，支持相似性检索、混合检索、全文检索。">
                  <icon-question-circle />
                </a-tooltip>
              </div>
            </div>
            <a-radio-group
              v-model="form.retrieval_config.retrieval_strategy"
              default-value="semantic"
              @change="handleUpdateNodeInfo"
              :options="[
                { label: '混合策略', value: 'hybrid' },
                { label: '全文检索', value: 'full_text' },
                { label: '相似性检索', value: 'semantic' },
              ]"
            />
          </div>
          <a-divider class="my-4" />
          <!-- 最大召回数量 -->
          <div class="flex flex-col gap-2">
            <!-- 标题&操作按钮 -->
            <div class="flex items-center justify-between">
              <!-- 左侧标题 -->
              <div class="flex items-center gap-2 text-gray-700 font-semibold">
                <div class="">最大召回数量</div>
                <a-tooltip content="配置知识库的最大召回数量，范围为0-10.">
                  <icon-question-circle />
                </a-tooltip>
              </div>
            </div>
            <div class="flex items-center gap-4 w-full pl-1">
              <a-slider
                v-model="form.retrieval_config.k"
                :step="1"
                :min="1"
                :max="10"
                @change="handleUpdateNodeInfo"
              />
              <a-input-number
                size="mini"
                v-model="form.retrieval_config.k"
                class="w-[80px]"
                :default-value="4"
                @blur="handleUpdateNodeInfo"
              />
            </div>
          </div>
          <a-divider class="my-4" />
          <!-- 最小匹配度 -->
          <div class="flex flex-col gap-2">
            <!-- 标题&操作按钮 -->
            <div class="flex items-center justify-between">
              <!-- 左侧标题 -->
              <div class="flex items-center gap-2 text-gray-700 font-semibold">
                <div class="">最小匹配度</div>
                <a-tooltip content="配置知识库的最小匹配度，范围为0-1">
                  <icon-question-circle />
                </a-tooltip>
              </div>
            </div>
            <div class="flex items-center gap-4 w-full pl-1">
              <a-slider
                v-model="form.retrieval_config.score"
                :step="0.01"
                :min="0"
                :max="0.99"
                @change="handleUpdateNodeInfo"
              />
              <a-input-number
                size="mini"
                v-model="form.retrieval_config.score"
                class="w-[80px]"
                :min="0"
                :max="0.99"
                :step="0.01"
                :precision="2"
                :default-value="0.5"
                @blur="handleUpdateNodeInfo"
              />
            </div>
          </div>
          <a-divider class="my-4" />
          <!-- 关联知识库 -->
          <div class="flex flex-col gap-2">
            <!-- 标题&操作按钮 -->
            <div class="flex items-center justify-between">
              <!-- 左侧标题 -->
              <div class="flex items-center gap-2 text-gray-700 font-semibold">
                <div class="">关联知识库</div>
                <a-tooltip content="绑定知识库检索节点需要检索的知识库，最多可以关联5个知识库。">
                  <icon-question-circle />
                </a-tooltip>
              </div>
              <!-- 右侧关联知识库按钮 -->
              <a-button
                size="mini"
                type="text"
                class="!text-gray-700"
                @click="() => (datasetsModalVisible = true)"
              >
                <template #icon>
                  <icon-plus />
                </template>
              </a-button>
            </div>
            <div v-if="form.datasets?.length > 0" class="flex flex-col gap-1">
              <div
                v-for="(dataset, idx) in form.datasets"
                :key="dataset.id"
                class="flex items-center justify-between bg-white px-2 py-1.5 rounded-lg cursor-pointer hover:shadow-sm hover:bg-gray-100 duration-150 group border border-gray-200"
              >
                <!-- 左侧知识库信息 -->
                <div class="flex items-center gap-2">
                  <!-- 图标 -->
                  <a-avatar
                    :size="30"
                    shape="square"
                    class="rounded flex-shrink-0"
                    :image-url="dataset.icon"
                  />
                  <!-- 名称与描述信息 -->
                  <div class="flex flex-col flex-1 gap-1">
                    <div class="text-gray-700 font-bold text-xs line-clamp-1 break-all">
                      {{ dataset.name }}
                    </div>
                    <div class="text-gray-500 text-xs line-clamp-1 break-all">
                      {{ dataset.description }}
                    </div>
                  </div>
                </div>
                <!-- 右侧删除按钮 -->
                <a-button
                  size="mini"
                  type="text"
                  class="hidden group-hover:block flex-shrink-0 ml-2 text-red-600 rounded"
                  @click="() => removeDataset(Number(idx))"
                >
                  <template #icon>
                    <icon-delete />
                  </template>
                </a-button>
              </div>
            </div>
            <div v-else class="text-xs text-gray-500 leading-[22px]">
              引用文本类型的数据，实现知识问答，工作流最多支持关联 5 个知识库。
            </div>
          </div>
          <a-divider class="my-4" />
          <!-- 输出参数 -->
          <div class="flex flex-col gap-2">
            <!-- 输出标题 -->
            <div class="font-semibold text-gray-700">输出数据</div>
            <!-- 字段标题 -->
            <div class="text-gray-500 text-xs">参数名</div>
            <!-- 输出参数列表 -->
            <div v-for="(output, idx) in form?.outputs" :key="idx" class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <div class="text-gray-700">{{ output.name }}</div>
                <div class="text-gray-500 bg-gray-100 px-1 py-0.5 rounded">
                  {{ output.type }}
                </div>
              </div>
            </div>
          </div>
        </a-form>
      </div>
    </div>
    <AddDatasetModal
      v-model:visible="datasetsModalVisible"
      :node-datasets="form.datasets"
      @update-node-datasets="updateNodeDatasets"
    />
  </div>
</template>

<style scoped>
.flow-node-info__bg {
  background: linear-gradient(#8e51ff10 0%, transparent 80%);
}

:deep(textarea.arco-textarea) {
  font-size: 12px !important;
  color: #6a7282 !important;
}

:deep(.arco-select-dropdown .arco-select-option) {
  font-size: 12px !important;
}
</style>
