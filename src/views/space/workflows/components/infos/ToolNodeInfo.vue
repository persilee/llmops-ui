<script setup lang="ts">
import type { TextareaInstance } from '@arco-design/web-vue'
import { useVueFlow } from '@vue-flow/core'
import { cloneDeep, isEqual } from 'lodash'
import { computed, ref, watch, type PropType } from 'vue'
import { useWorkflowStore } from '../../Workflow.store'

// 定义自定义组件所需数据
const props = defineProps({
  node: {
    type: Object as PropType<Record<string, any>> | null,
    default: () => {},
  },
})
const emits = defineEmits(['closeNodeInfo', 'updateNode'])
const visible = defineModel('visible', { type: Boolean, default: false })
const { nodes, edges } = useVueFlow()
const store = useWorkflowStore()
const form = ref<Record<string, any>>({})
const descriptionVisible = ref(false)
const descriptionRef = ref<TextareaInstance | null>(null)
const defaultToolMeta = {
  type: 'api_tool',
  provider: { id: '', name: '', label: '', icon: '', description: '' },
  tool: { id: '', name: '', label: '', description: '', params: {} },
}

// 定义节点可引用的变量选项
const inputRefOptions = computed(() => {
  return store.getReferencedVariables(cloneDeep(nodes.value), cloneDeep(edges.value), props.node.id)
})

const handleClickDescription = () => {
  descriptionVisible.value = true
  setTimeout(() => {
    descriptionRef.value?.focus()
  }, 160)
}

const handleUpdateDesc = () => {
  descriptionVisible.value = false
  handleUpdateNodeInfo()
}

const handleUpdateNodeInfo = () => {
  const node = nodeToFrom(props.node)
  if (isEqual(node, form.value)) return

  // 深度拷贝表单数据内容
  const cloneInputs = cloneDeep(form.value.inputs)
  const cloneParams = cloneDeep(form.value.params)
  const params: Record<string, any> = {}
  cloneParams.forEach((param: Record<string, any>) => {
    params[param.key] = param.value
  })

  // 数据校验通过，通过事件触发数据更新
  emits('updateNode', {
    id: props.node.id,
    title: form.value.title,
    description: form.value.description,
    type: form.value.tool?.type,
    provider_id: form.value.tool?.provider.id,
    tool_id: form.value.tool?.tool.name,
    meta: cloneDeep(form.value.tool),
    params: params, // 将列表转换成字典
    inputs: cloneInputs.map((input: Record<string, any>) => {
      return {
        name: input.name,
        description: '',
        required: true,
        type: input.value_type === 'ref' ? 'string' : input.type,
        value: {
          type: input.value_type === 'ref' ? 'ref' : 'literal',
          content:
            input.value_type === 'ref'
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

const nodeToFrom = (newNode: any) => {
  const cloneInputs = cloneDeep(newNode.data.inputs)
  const cloneParams = cloneDeep(newNode.data.params)
  return {
    id: newNode.id,
    type: newNode.type,
    title: newNode.data.title,
    description: newNode.data.description,
    tool: cloneDeep(newNode.data.meta) ?? defaultToolMeta,
    params: Object.entries(cloneParams).map(([key, value]) => ({
      key: key,
      value: value,
    })), // 将字典转换成列表
    inputs: cloneInputs.map((input: any) => {
      // 计算引用的变量值信息
      const ref =
        input.value.type === 'ref'
          ? `${input.value.content.ref_node_id}/${input.value.content.ref_var_name}`
          : ''

      // 判断引用的变量值信息是否存在，如果不存在则设置为空
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
        type: input.type,
        value_type: input.value.type === 'literal' ? input.type : 'ref', // 数据类型(涵盖ref/string/int/float/boolean
        content: input.value.type === 'literal' ? input.value.content : '', // 变量值内容
        ref: input.value.type === 'ref' && refExists ? ref : '', // 变量引用信息，存储引用节点id+引用变量名
      }
    }),
    outputs: [{ name: 'text', type: 'string', value: { type: 'generated', content: '' } }],
  }
}

// 监听数据，将数据映射到表单模型上
watch(
  () => props.node,
  (newNode) => {
    if (!newNode) return
    form.value = nodeToFrom(newNode)
  },
  { immediate: true },
)
</script>

<template>
  <div v-if="visible" class="absolute right-0 top-0 bottom-0 w-[400px] p-2.5 node-info">
    <div
      class="flex flex-col h-full bg-white z-50 p-4 border border-gray-100 shadow-lg rounded-lg relative"
      @click.stop
    >
      <div class="flow-node-info__bg w-full h-[120px] absolute top-0 left-0 rounded-lg z-0"></div>
      <div class="z-100 h-full">
        <!-- 顶部标题信息 -->
        <div class="flex items-center justify-between gap-3 mb-2">
          <!-- 左侧标题 -->
          <div class="flex items-center gap-1 flex-1">
            <a-avatar
              v-if="form?.tool?.provider?.icon"
              :size="26"
              shape="square"
              class="rounded flex-shrink-0 bg-transparent"
              :image-url="form?.tool?.provider?.icon"
            />
            <a-avatar
              v-else
              :size="26"
              shape="square"
              class="bg-orange-500 rounded-lg flex-shrink-0"
            >
              <icon-tool />
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
          v-model="form.tool.tool.description"
          class="rounded-lg bg-transparent"
          placeholder="输入描述..."
          @blur="handleUpdateDesc"
        />
        <div
          v-show="!descriptionVisible"
          class="text-xs text-gray-500"
          @click="handleClickDescription"
        >
          {{ form.tool.tool.description || '添加描述' }}
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
            <div class="flex items-center gap-1 text-xs text-gray-500 mb-1 mt-1">
              <div class="w-[20%]">参数名</div>
              <div class="w-[35%]">类型</div>
              <div class="w-[45%]">值</div>
            </div>
            <!-- 循环遍历字段列表 -->
            <div v-for="(input, idx) in form?.inputs" :key="idx" class="flex items-center gap-1">
              <div class="w-[20%] flex-shrink-0">
                <div class="flex items-center gap-1 text-xs text-gray-500">
                  <div class="">{{ input.name }}</div>
                </div>
              </div>
              <div class="w-[30%] flex-shrink-0">
                <a-select
                  size="mini"
                  v-model="input.value_type"
                  class="px-2"
                  :options="[
                    { label: '引用', value: 'ref' },
                    { label: '直接输入', value: 'literal' },
                  ]"
                  @change="handleUpdateNodeInfo"
                />
              </div>
              <div class="w-[50%] flex-shrink-0 flex items-center gap-1">
                <a-input
                  v-if="input.value_type !== 'ref'"
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
                  :options="inputRefOptions"
                  @change="handleUpdateNodeInfo"
                />
              </div>
            </div>
            <!-- 空数据状态 -->
            <a-empty v-if="form?.inputs.length <= 0" class="my-4">该节点暂无输入数据</a-empty>
          </div>
          <a-divider class="my-4" />
          <!-- PARAMS参数 -->
          <div class="flex flex-col gap-2">
            <!-- 标题&操作按钮 -->
            <div class="flex items-center justify-between">
              <!-- 左侧标题 -->
              <div class="flex items-center gap-2 text-gray-700 font-semibold">
                <div class="">PARAMS参数</div>
                <a-tooltip content="内置工具使用的PARAMS参数，用于初始化内置工具。">
                  <icon-question-circle />
                </a-tooltip>
              </div>
            </div>
            <!-- 字段名 -->
            <div
              v-if="form?.params?.length > 0"
              class="flex items-center gap-1 text-xs text-gray-500 mb-2"
            >
              <div class="w-[20%]">参数名</div>
              <div class="w-[80%]">值</div>
            </div>
            <!-- 循环遍历字段列表 -->
            <div v-for="(param, idx) in form?.params" :key="idx" class="flex items-center gap-1">
              <div class="w-[20%] flex-shrink-0">
                <div class="flex items-center gap-1 text-xs text-gray-500">
                  <div class="">{{ param.key }}</div>
                </div>
              </div>
              <div class="w-[80%] flex-shrink-0">
                <a-input size="mini" v-model="param.value" placeholder="请输入参数值" />
              </div>
            </div>
            <!-- 空数据状态 -->
            <a-empty v-if="form?.params.length <= 0" class="my-4">该工具暂无PARAMS数据</a-empty>
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
                <div class="text-gray-500 text-xs bg-gray-100 px-1 py-0.5 rounded">
                  {{ output.type }}
                </div>
              </div>
            </div>
          </div>
        </a-form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flow-node-info__bg {
  background: linear-gradient(#ff690010 0%, transparent 80%);
}

:deep(textarea.arco-textarea) {
  font-size: 12px !important;
  color: #6a7282 !important;
}
</style>
