<script setup lang="ts">
import { type TextareaInstance } from '@arco-design/web-vue'
import { useVueFlow } from '@vue-flow/core'
import { cloneDeep, isEqual } from 'lodash'
import { computed, ref, watch, type PropType } from 'vue'
import { useWorkflowStore } from '../../Workflow.store'
import LLMModelConfig from './LLMModelConfig.vue'

// 1.定义自定义组件所需数据
const props = defineProps({
  node: {
    type: Object as PropType<Record<string, any>> | null,
    default: () => {},
  },
})
const emits = defineEmits(['updateNode', 'closeNodeInfo'])
const visible = defineModel('visible', { type: Boolean, default: false })
const { nodes, edges } = useVueFlow()
const form = ref<Record<string, any>>({})
const store = useWorkflowStore()
const descriptionVisible = ref(false)
const descriptionRef = ref<TextareaInstance | null>(null)

// 定义节点可引用的变量选项
const inputRefOptions = computed(() => {
  return store.getReferencedVariables(cloneDeep(nodes.value), cloneDeep(edges.value), props.node.id)
})

// 定义添加表单输入字段函数
const addFormInputField = () => {
  // [功能升级] 内容默认设置为null避免字段类型切换错误
  form.value?.inputs.push({ name: '', type: 'string', content: null, ref: '' })
}

// 定义移除表单输入字段函数
const removeFormInputField = (idx: number) => {
  form.value?.inputs?.splice(idx, 1)
  handleUpdateNodeInfo()
}

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

  // 4.2 深度拷贝表单数据内容
  const cloneInputs = cloneDeep(form.value.inputs)

  // 4.3 数据校验通过，通过事件触发数据更新
  emits('updateNode', {
    id: props.node.id,
    title: form.value.title,
    description: form.value.description,
    prompt: form.value.prompt,
    model_config: form.value.model_config,
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

const nodeToFrom = (newNode: any) => {
  const cloneInputs = cloneDeep(newNode.data.inputs)

  return {
    id: newNode.id,
    type: newNode.type,
    title: newNode.data.title,
    description: newNode.data.description,
    prompt: newNode.data.prompt,
    model_config: newNode.data.language_model_config,
    inputs: cloneInputs.map((input: any) => {
      // 5.1 计算引用的变量值信息
      const ref =
        input.value.type === 'ref'
          ? `${input.value.content.ref_node_id}/${input.value.content.ref_var_name}`
          : ''

      // 5.2 判断引用的变量值信息是否存在，如果不存在则设置为空
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
    outputs: [{ name: 'output', type: 'string', value: { type: 'generated', content: '' } }],
  }
}

// 5.监听数据，将数据映射到表单模型上
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
      <div class="flow-node-info__bg w-full h-[120px] absolute top-0 left-0 rounded-xl z-0"></div>
      <div class="z-100 h-full">
        <!-- 顶部标题信息 -->
        <div class="flex items-center justify-between gap-3 mb-2">
          <!-- 左侧标题 -->
          <div class="flex items-center gap-1 flex-1">
            <a-avatar shape="square" :size="26" class="bg-sky-500 rounded-lg flex-shrink-0">
              <icon-language :size="16" />
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
          <!-- 模型选择 -->
          <div class="flex flex-col gap-2">
            <!-- 标题&操作按钮 -->
            <div class="flex items-center justify-between">
              <!-- 左侧标题 -->
              <div class="flex items-center gap-2 text-gray-700 font-semibold">
                <div class="">语言模型配置</div>
                <a-tooltip content="选择不同的大语言模型作为节点的底座模型">
                  <icon-question-circle />
                </a-tooltip>
              </div>
              <!-- 右侧选择模型 -->
              <LLMModelConfig v-model:model_config="form.model_config" />
            </div>
          </div>
          <a-divider class="my-4" />
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
              <!-- 右侧新增字段按钮 -->
              <a-button
                type="text"
                size="mini"
                class="!text-gray-700"
                @click="() => addFormInputField()"
              >
                <template #icon>
                  <icon-plus />
                </template>
              </a-button>
            </div>
            <!-- 字段名 -->
            <div class="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <div class="w-[20%]">参数名</div>
              <div class="w-[25%]">类型</div>
              <div class="w-[47%]">值</div>
              <div class="w-[8%]"></div>
            </div>
            <!-- 循环遍历字段列表 -->
            <div v-for="(input, idx) in form?.inputs" :key="idx" class="flex items-center gap-1">
              <div class="w-[20%] flex-shrink-0">
                <a-input
                  v-model="input.name"
                  size="mini"
                  placeholder="请输入参数名"
                  class="!px-2"
                  @blur="handleUpdateNodeInfo"
                />
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
                    { label: 'LIST[STRING]', value: 'list[string]' },
                    { label: 'LIST[INT]', value: 'list[int]' },
                    { label: 'LIST[FLOAT]', value: 'list[float]' },
                    { label: 'LIST[BOOLEAN]', value: 'list[boolean]' },
                  ]"
                />
              </div>
              <div class="w-[47%] flex-shrink-0 flex items-center gap-1">
                <a-input-tag
                  v-if="input.type.startsWith('list')"
                  size="mini"
                  v-model="input.content"
                  :default-value="[]"
                  placeholder="请输入参数值，按回车结束"
                  @blur="handleUpdateNodeInfo"
                />
                <a-input
                  v-else-if="input.type !== 'ref'"
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
              <div class="w-[8%] text-right">
                <icon-minus-circle
                  class="text-gray-500 hover:text-gray-700 cursor-pointer flex-shrink-0"
                  @click="() => removeFormInputField(Number(idx))"
                />
              </div>
            </div>
            <!-- 空数据状态 -->
            <a-empty v-if="form?.inputs.length <= 0" class="my-4">该节点暂无输入数据</a-empty>
          </div>
          <a-divider class="my-4" />
          <!-- 提示词 -->
          <div class="flex flex-col gap-2">
            <!-- 标题&操作按钮 -->
            <div class="flex items-center justify-between">
              <!-- 左侧标题 -->
              <div class="flex items-center gap-2 text-gray-700 font-semibold">
                <div class="">提示词</div>
                <a-tooltip
                  content="作为人类消息传递给大语言模型，可以使用{{参数名}}插入引用/创建的变量。"
                >
                  <icon-question-circle />
                </a-tooltip>
              </div>
            </div>
            <!-- 提示词输入框 -->
            <a-form-item field="prompt" hide-label hide-asterisk required>
              <a-textarea
                :auto-size="{ minRows: 5, maxRows: 10 }"
                v-model="form.prompt"
                placeholder="编写大模型的提示词，使大模型实现对应的功能。通过插入{{参数名}}可以引用对应的参数值。"
                class="rounded-lg bg-gray-100"
                @blur="handleUpdateNodeInfo"
              />
            </a-form-item>
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
                <div class="text-gray-500 bg-gray-100 px-1 py-0.5 rounded">{{ output.type }}</div>
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
  background: linear-gradient(#00a6f416 0%, transparent 80%);
}

:deep(textarea.arco-textarea) {
  font-size: 12px !important;
  color: #6a7282 !important;
}
</style>
