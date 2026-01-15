<script setup lang="ts">
import CodeEditor from '@/views/components/CodeEditor.vue'
import { Message, type TextareaInstance } from '@arco-design/web-vue'
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
const form = ref<Record<string, any>>({})
const store = useWorkflowStore()
const descriptionVisible = ref(false)
const descriptionRef = ref<TextareaInstance | null>(null)
const isShowCodeEditor = ref(false)

// 定义输入变量引用选项
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

const handleOpenIDE = () => {
  isShowCodeEditor.value = true
}

// 定义添加表单字段函数
const addFormInputField = () => {
  form.value?.inputs.push({ name: '', type: 'string', content: null, ref: '' })
  Message.success('新增输入字段成功')
}

// 定义移除表单字段函数
const removeFormInputField = (idx: number) => {
  form.value?.inputs?.splice(idx, 1)
  handleUpdateNodeInfo()
}

// 定义表单添加输出变量函数
const addFormOutputField = () => {
  form.value?.outputs.push({
    name: '',
    description: '',
    required: true,
    type: 'string',
    value: {
      type: 'generated',
      content: '',
    },
    meta: {},
  })
}

// 定义表单移除输出变量函数
const removeFormOutputField = (idx: number) => {
  form.value?.outputs.splice(idx, 1)
  handleUpdateNodeInfo()
}

const handleUpdateNodeInfo = () => {
  const node = nodeToFrom(props.node)
  if (isEqual(node, form.value)) return
  // 深度拷贝表单数据内容
  const cloneInputs = cloneDeep(form.value.inputs)

  // 数据校验通过，通过事件触发数据更新
  emits('updateNode', {
    id: props.node.id,
    title: form.value.title,
    description: form.value.description,
    code: form.value.code,
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
    code: newNode.data.code,
    inputs: cloneInputs.map((input: any) => {
      // 5.1 计算引用的变量值信息
      const ref =
        input.value.type === 'ref'
          ? `${input.value.content.ref_node_id}/${input.value.content.ref_var_name}`
          : ''
      // 5.2 判断引用的变量值信息是否存在
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
        content: input.value.type === 'literal' ? input.value.content : null, // 变量值内容
        ref: input.value.type === 'ref' && refExists ? ref : '', // 变量引用信息，存储引用节点id+引用变量名
      }
    }),
    outputs: cloneDeep(newNode.data.outputs),
  }
}

// 监听数据，将数据映射到表单模型上
watch(
  () => props.node,
  (newNode) => {
    form.value = nodeToFrom(newNode)
  },
  { immediate: true },
)
</script>

<template>
  <div
    v-if="visible"
    class="flex absolute left-0 top-0 w-full h-full p-2.5 node-info pointer-events-none"
  >
    <div class="w-full min-w-0 shrink-1 grow-0">
      <CodeEditor
        v-if="isShowCodeEditor"
        v-model:code="form.code"
        :options="{ lineNumbersMinChars: 3 }"
        @blur="handleUpdateNodeInfo"
        class="rounded-l-lg pointer-events-auto"
      >
        <a-button
          type="text"
          size="mini"
          class="hover:bg-gray-200"
          @click.stop="isShowCodeEditor = false"
        >
          <template #icon><icon-double-right class="text-gray-500 text-base" /></template>
        </a-button>
      </CodeEditor>
    </div>
    <div class="grow-1 shrink-0 min-w-0">
      <div
        :class="`flex flex-col h-full w-[400px] bg-white z-50 p-4 border border-gray-100 relative pointer-events-auto ${isShowCodeEditor ? 'rounded-r-lg' : 'shadow-lg rounded-lg'}`"
        @click.stop
      >
        <div
          :class="`flow-node-info__bg w-full h-[120px] absolute top-0 left-0 z-0 ${isShowCodeEditor ? 'rounded-r-lg' : 'rounded-lg'}`"
        ></div>
        <div class="z-100 h-full">
          <!-- 顶部标题信息 -->
          <div class="flex items-center justify-between gap-3 mb-2">
            <!-- 左侧标题 -->
            <div class="flex items-center gap-1 flex-1">
              <a-avatar shape="square" :size="26" class="bg-cyan-500 rounded-lg flex-shrink-0">
                <icon-code :size="16" />
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
                  <div class="">输入参数</div>
                  <a-tooltip content="代码运行的输入变量。代码中可以直接引用此处添加的变量。">
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
                <div class="w-[30%]">参数名</div>
                <div class="w-[25%]">类型</div>
                <div class="w-[37%]">值</div>
                <div class="w-[8%]"></div>
              </div>
              <!-- 循环遍历字段列表 -->
              <div v-for="(input, idx) in form?.inputs" :key="idx" class="flex items-center gap-1">
                <div class="w-[30%] flex-shrink-0">
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
                <div class="w-[37%] flex-shrink-0 flex items-center gap-1">
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
            <!-- 代码 -->
            <div class="flex flex-col gap-2">
              <!-- 标题&操作按钮 -->
              <div class="flex items-center justify-between">
                <!-- 左侧标题 -->
                <div class="flex items-center gap-2 text-gray-700 font-semibold">
                  <div class="">代码</div>
                  <a-tooltip content="需要在后端执行的源代码，函数名为main，参数固定为params。">
                    <icon-question-circle />
                  </a-tooltip>
                </div>
              </div>
              <a-form-item field="code" hide-label hide-asterisk required>
                <div class="h-[200px] w-full">
                  <CodeEditor
                    v-model:code="form.code"
                    @blur="handleUpdateNodeInfo"
                    class="rounded-lg"
                  >
                    <a-button
                      type="text"
                      size="mini"
                      class="bg-blue-100 rounded-sm font-semibold"
                      @click="handleOpenIDE"
                    >
                      <template #icon><icon-expand class="h-3" /></template>
                      在IDE中编辑</a-button
                    >
                  </CodeEditor>
                </div>
              </a-form-item>
            </div>
            <a-divider class="my-4" />
            <!-- 输出参数 -->
            <div class="flex flex-col gap-2">
              <!-- 标题&操作按钮 -->
              <div class="flex items-center justify-between">
                <!-- 左侧标题 -->
                <div class="flex items-center gap-2 text-gray-700 font-semibold">
                  <div class="">输出参数</div>
                  <a-tooltip
                    content="代码运行后的输出变量。此处的变量名、变量类型必须与代码中 return 结果一致。"
                  >
                    <icon-question-circle />
                  </a-tooltip>
                </div>
                <!-- 右侧新增字段按钮 -->
                <a-button
                  type="text"
                  size="mini"
                  class="!text-gray-700"
                  @click="() => addFormOutputField()"
                >
                  <template #icon>
                    <icon-plus />
                  </template>
                </a-button>
              </div>
              <!-- 字段名 -->
              <div class="flex items-center gap-1 text-xs text-gray-500 mb-2">
                <div class="w-[46%]">参数名</div>
                <div class="w-[46%]">类型</div>
                <div class="w-[8%]"></div>
              </div>
              <!-- 循环遍历字段列表 -->
              <div
                v-for="(output, idx) in form?.outputs"
                :key="idx"
                class="flex items-center gap-1"
              >
                <div class="w-[46%] flex-shrink-0">
                  <a-input
                    v-model="output.name"
                    size="mini"
                    placeholder="请输入参数名"
                    class="!px-2"
                    @blur="handleUpdateNodeInfo"
                  />
                </div>
                <div class="w-[46%] flex-shrink-0">
                  <a-select
                    size="mini"
                    v-model="output.type"
                    class="px-2"
                    @change="handleUpdateNodeInfo"
                    :options="[
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
                <div class="w-[8%] text-right">
                  <icon-minus-circle
                    class="text-gray-500 hover:text-gray-700 cursor-pointer flex-shrink-0"
                    @click="() => removeFormOutputField(Number(idx))"
                  />
                </div>
              </div>
              <!-- 空数据状态 -->
              <a-empty v-if="form?.outputs?.length <= 0" class="my-4">该节点暂无输出数据</a-empty>
            </div>
          </a-form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flow-node-info__bg {
  background: linear-gradient(#00b8db10 0%, transparent 80%);
}

:deep(textarea.arco-textarea) {
  font-size: 12px !important;
  color: #6a7282 !important;
}
</style>
