<script setup lang="ts">
import CodeEditor from '@/views/components/CodeEditor.vue'
import { type TextareaInstance } from '@arco-design/web-vue'
import { useVueFlow } from '@vue-flow/core'
import { cloneDeep, isEqual } from 'lodash'
import type { editor } from 'monaco-editor'
import * as monaco from 'monaco-editor'
import { computed, onMounted, reactive, ref, useTemplateRef, watch, type PropType } from 'vue'
import { useWorkflowStore } from '../../Workflow.store'
import NodeRunResult from './NodeRunResult.vue'

// 定义自定义组件所需数据
const props = defineProps({
  node: {
    type: Object as PropType<Record<string, any>> | null,
    default: () => {},
  },
})
const visible = defineModel('visible', { type: Boolean, default: false })
const emits = defineEmits(['updateNode', 'closeNodeInfo'])
const { nodes, edges } = useVueFlow()
const form = ref<Record<string, any>>({})
const store = useWorkflowStore()
const descriptionVisible = ref(false)
const descriptionRef = ref<TextareaInstance | null>(null)
const editorContainer = useTemplateRef('editorContainer')
const isShowVariablesMenu = ref(false)
const popupPosition = reactive({
  top: 0,
  left: 0,
})
// { lineNumber: 3, column: 3 }
const cursorPosition = ref<any>(null)
let editorRef: any = null

const activatedTab = computed({
  get: () => (store.isNodeDebugRunning ? 'running' : 'setting'),
  set: (val) => {
    store.isNodeDebugRunning = val === 'running'
  },
})

// 定义输入变量引用选项
const inputRefOptions = computed(() => {
  return store.getReferencedVariables(cloneDeep(nodes.value), cloneDeep(edges.value), props.node.id)
})

// 定义添加表单字段函数
const addFormInputField = () => {
  form.value?.inputs.push({ name: '', type: 'string', content: null, ref: '' })
}

const addFormInputFieldToCodeEditor = (input: Record<string, any>) => {
  const existedInput = form.value?.inputs.find((item: any) => item.ref == input.value)

  // 获取编辑器模型
  const model = editorRef.getModel()
  if (!model) return
  // 获取当前行内容
  const lineContent = model.getLineContent(cursorPosition.value.lineNumber)
  // 检测光标后是否有单词
  const cursorIndex = cursorPosition.value.column - 1 // 转换为0-based索引
  const lineAfterCursor = lineContent.substring(cursorIndex)
  const wordBoundaryRegex = /\}\}/
  const match = wordBoundaryRegex.exec(lineAfterCursor)

  let editOperation: editor.IIdentifiedSingleEditOperation
  if (match && match.index > 0) {
    // 光标后有单词，进行替换操作
    const wordEnd = cursorIndex + match.index
    editOperation = {
      range: new monaco.Range(
        cursorPosition.value.lineNumber,
        cursorPosition.value.column,
        cursorPosition.value.lineNumber,
        wordEnd + 1,
      ),
      text: existedInput ? existedInput.name : input.label,
      forceMoveMarkers: true,
    }
  } else {
    const text = existedInput ? existedInput.name : input.label
    const finalText = match ? text : `${text}\}\}`
    // 创建编辑操作
    editOperation = {
      range: new monaco.Range(
        cursorPosition.value.lineNumber,
        cursorPosition.value.column,
        cursorPosition.value.lineNumber,
        cursorPosition.value.column,
      ),
      text: finalText,
      forceMoveMarkers: true,
    }
  }

  // 执行插入操作
  editorRef.executeEdits('insert-text', [editOperation])
  // 插入后移动光标到文本末尾
  const newPosition = cursorPosition.value.clone()
  newPosition.column += input.label.length
  editorRef.setPosition(newPosition)

  // 确保编辑器获得焦点
  editorRef.focus()
  cursorPosition.value = null

  if (existedInput) return
  form.value?.inputs.push({
    name: input.label,
    type: 'ref',
    content: null,
    ref: input.value,
  })
  isShowVariablesMenu.value = false
}

// 定义移除表单字段函数
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
  store.isDebug = false
  const node = nodeToFrom(props.node)
  if (isEqual(node, form.value)) return

  //  深度拷贝表单数据内容
  const cloneInputs = cloneDeep(form.value.inputs)

  //  数据校验通过，通过事件触发数据更新
  emits('updateNode', {
    id: props.node.id,
    title: form.value.title,
    description: form.value.description,
    template: form.value.template,
    inputs: cloneInputs.map((input: Record<string, any>) => {
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
                  ref_node_id: input.ref.split('/', 2)[0] || '',
                  ref_var_name: input.ref.split('/', 2)[1] || '',
                }
              : input.content,
        },
        meta: {},
      }
    }),
    outputs: cloneDeep(form.value.outputs),
  })
}

const inputToFromInput = (input: Record<string, any>) => {
  // 计算引用的变量值信息
  const ref =
    input.value.type === 'ref'
      ? `${input.value.content.ref_node_id}/${input.value.content.ref_var_name}`
      : ''
  // 判断引用的变量值信息是否存在
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
}

const nodeToFrom = (newNode: any) => {
  const cloneInputs = cloneDeep(newNode.data.inputs)
  return {
    id: newNode.id,
    type: newNode.type,
    title: newNode.data.title,
    description: newNode.data.description,
    template: newNode.data.template,
    inputs: cloneInputs.map((input: any) => {
      return inputToFromInput(input)
    }),
    outputs: [{ name: 'output', type: 'string', value: { type: 'generated', content: '' } }],
  }
}

const handleChangeCursorPosition = (editorInstance: any) => {
  if (!editorInstance || !editorContainer.value) return
  if (!editorRef) {
    editorRef = editorInstance
  }

  // 获取当前光标位置
  const position = editorInstance.getPosition()

  if (!position) return

  // 更新行号和列号
  const currentLineNumber = position.lineNumber
  const currentColumn = position.column

  // 获取当前行内容
  const model = editorInstance.getModel()
  if (model) {
    const currentLineContent = model.getLineContent(currentLineNumber)
    const textBeforeCursor = currentLineContent.substring(currentColumn - 3, currentColumn - 1)

    // 将光标位置转换为编辑器中的像素坐标
    const coordinatesY = editorInstance.getTopForLineNumber(currentLineNumber)
    const coordinatesX = editorInstance.getOffsetForColumn(currentLineNumber, currentColumn)

    // 获取单行高度
    const singleLineHeight = editorInstance.getLineHeightForPosition(position)

    // 计算当前行的实际高度（考虑换行）
    const totalLines = model.getLineCount()
    const nextLineTop = editorInstance.getTopForLineNumber(position.lineNumber + 1)
    let actualLineHeight
    if (totalLines == 1) {
      actualLineHeight = nextLineTop + singleLineHeight - coordinatesY
    } else {
      actualLineHeight = nextLineTop - coordinatesY
    }

    // 判断是否换行
    const isLineWrapped = actualLineHeight > singleLineHeight
    // 计算实际显示的行数
    const actualLineCount = Math.round(actualLineHeight / singleLineHeight)

    // 计算光标在当前行中的垂直偏移（考虑换行）
    let cursorVerticalOffset = 0
    if (isLineWrapped) {
      const cursorIndex = position.column - 1 // 转换为0-based索引
      const lineLength = currentLineContent.length
      if (lineLength > 0) {
        // 计算光标在文本中的水平位置比例
        const horizontalRatio = Math.min(cursorIndex / lineLength, 1)

        // 计算换行后的垂直偏移
        // 假设换行是均匀分布的，按比例分配垂直位置
        cursorVerticalOffset = horizontalRatio * (actualLineHeight - singleLineHeight)
      }
    }
    // 计算距离顶部的总距离
    const distanceEditorTop = coordinatesY + cursorVerticalOffset

    if (textBeforeCursor == '{{') {
      isShowVariablesMenu.value = true
      cursorPosition.value = position
    } else {
      isShowVariablesMenu.value = false
    }
    // 计算弹窗位置
    popupPosition.top = distanceEditorTop + 60
    popupPosition.left = coordinatesX - 65
  }
}

const handleCodeEditorBlur = () => {
  if (!cursorPosition.value) {
    isShowVariablesMenu.value = false
    cursorPosition.value = null
  }
  handleUpdateNodeInfo()
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

onMounted(() => {
  store.isNodeDebugRunning = false
})
</script>

<template>
  <div v-if="visible" class="absolute right-0 top-0 bottom-0 w-[400px] p-2.5 node-info">
    <div
      class="flex flex-col h-full bg-white z-50 p-4 border border-gray-100 shadow-lg rounded-lg relative"
    >
      <div class="flow-node-info__bg w-full h-[120px] absolute top-0 left-0 rounded-lg z-0"></div>
      <div class="z-100 h-full">
        <!-- 顶部标题信息 -->
        <div class="flex items-center justify-between gap-3 mb-2">
          <!-- 左侧标题 -->
          <div class="flex items-center gap-1 flex-1">
            <a-avatar shape="square" :size="26" class="bg-emerald-400 rounded-lg flex-shrink-0">
              <icon-branch :size="16" />
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
        <a-tabs v-model:active-key="activatedTab" size="mini" :header-padding="false" class="mt-3">
          <a-tab-pane key="setting" title="设置">
            <!-- 表单信息 -->
            <a-form size="mini" :model="form" layout="vertical">
              <!-- 输入参数 -->
              <div class="flex flex-col gap-2">
                <!-- 标题&操作按钮 -->
                <div class="flex items-center justify-between">
                  <!-- 左侧标题 -->
                  <div class="flex items-center gap-2 text-gray-700 font-semibold">
                    <div class="">输入参数</div>
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
                  <div class="w-[30%]">参数名</div>
                  <div class="w-[25%]">类型</div>
                  <div class="w-[37%]">值</div>
                  <div class="w-[8%]"></div>
                </div>
                <!-- 循环遍历字段列表 -->
                <div
                  v-for="(input, idx) in form?.inputs"
                  :key="idx"
                  class="flex items-start justify-center gap-1"
                >
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
                  <div class="flex flex-col w-[37%] items-start">
                    <div class="flex items-center gap-1 w-full">
                      <a-input-tag
                        v-if="input.type.startsWith('list')"
                        size="mini"
                        v-model="input.content"
                        :default-value="[]"
                        placeholder="请输入参数值，按回车结束"
                        @blur="handleUpdateNodeInfo"
                        :class="`${!input.ref && store.isDebug ? 'bg-red-100' : ''}`"
                      />
                      <a-input
                        v-else-if="input.type !== 'ref'"
                        size="mini"
                        v-model="input.content"
                        placeholder="请输入参数值"
                        @blur="handleUpdateNodeInfo"
                        :class="`${!input.ref && store.isDebug ? 'bg-red-100' : ''}`"
                      />
                      <a-select
                        v-else
                        placeholder="请选择引用变量"
                        size="mini"
                        tag-nowrap
                        v-model="input.ref"
                        :options="inputRefOptions"
                        @change="handleUpdateNodeInfo"
                        :class="`${!input.ref && store.isDebug ? 'bg-red-100' : ''}`"
                      />
                    </div>
                    <div
                      v-if="!input.content && !input.ref && store.isDebug"
                      class="text-red-500 text-xs mt-1"
                    >
                      参数值不能为空
                    </div>
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
              <!-- 转换模板 -->
              <div class="flex flex-col gap-2">
                <!-- 标题&操作按钮 -->
                <div class="flex items-center justify-between">
                  <!-- 左侧标题 -->
                  <div class="flex items-center gap-2 text-gray-700 font-semibold">
                    <div class="">转换模板</div>
                    <a-tooltip
                      content="需要处理并转换字符串的模板，格式必须符合jinja2的模板要求，可以使用{{参数名}}引用变量。"
                    >
                      <icon-question-circle />
                    </a-tooltip>
                  </div>
                </div>
                <a-form-item field="template" hide-label hide-asterisk required>
                  <div
                    ref="editorContainer"
                    :class="`h-[200px] w-full  ${isShowVariablesMenu ? 'relative' : 'static'}`"
                  >
                    <CodeEditor
                      v-model:code="form.template"
                      :height="200"
                      class="rounded-lg overflow-hidden"
                      language-name="jinja"
                      :is-plaintext="true"
                      :placeholder="'输入 \{\{ 插入变量，通过插入\{\{参数名\}\}可以引用对应的参数值。'"
                      @change-cursor-position="handleChangeCursorPosition"
                      @blur="handleCodeEditorBlur"
                    />
                    <div
                      v-if="isShowVariablesMenu"
                      class="flex flex-col gap-1.5 bg-white py-3 px-1 rounded-lg w-[220px] max-h-[460px] border border-gray-100 shadow-lg absolute z-1000 overflow-y-scroll scrollbar-w-none"
                      :style="{
                        top: `${popupPosition.top}px`,
                        left: `${popupPosition.left}px`,
                      }"
                    >
                      <div v-for="(item, idx) in inputRefOptions" :key="idx" class="">
                        <div
                          class="flex items-center text-gray-500 text-xs font-semibold px-2 mb-1"
                        >
                          {{ item.label }}
                        </div>
                        <div
                          v-for="option in item.options"
                          :key="option.value"
                          class="flex item-center gap-1 px-2 py-0.5 hover:bg-gray-100 rounded-sm cursor-pointer"
                          @click.stop="addFormInputFieldToCodeEditor(option)"
                        >
                          <div class="flex-1 flex items-center gap-1">
                            <img src="@/assets/images/icon-var.svg" class="w-5 h-5" />
                            <div
                              class="text-gray-800 text-xs overflow-hidden text-ellipsis whitespace-nowrap max-w-[110px]"
                            >
                              {{ option.label }}
                            </div>
                          </div>
                          <div
                            class="text-gray-400 text-xs overflow-hidden text-ellipsis whitespace-nowrap max-w-[80px]"
                          >
                            {{ String(option.type).toLocaleUpperCase() }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </a-form-item>
              </div>
              <a-divider class="mb-4 mt-0.5" />
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
          </a-tab-pane>
          <NodeRunResult
            :node-result="store.templateTransformNodeResult"
            :loading="store.nodeDebugLoading"
          />
        </a-tabs>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flow-node-info__bg {
  background: linear-gradient(#00d49210 0%, transparent 80%);
}

:deep(textarea.arco-textarea) {
  font-size: 12px !important;
  color: #6a7282 !important;
}
</style>
