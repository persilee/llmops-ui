<script setup lang="ts">
import { nodeTypeMap } from '@/config'
import WorkFlowApi from '@/services/api/workflow'
import CodeEditor from '@/views/components/CodeEditor.vue'
import type { ValidatedError } from '@arco-design/web-vue'
import { useVueFlow } from '@vue-flow/core'
import { computed, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'
import { useWorkflowStore, type WorkflowStoreType } from '../Workflow.store'

const store = useWorkflowStore()
const visible = defineModel('visible', { type: Boolean, default: false })
const { nodes } = useVueFlow()
const form = ref<Record<string, any>>({})
const nodeResults = ref<Record<string, any>[]>([])
const activatedTab = ref('input')
const loading = ref(false)
const debugError = ref('')
const formRef = useTemplateRef('formRef')

// 2.输入变量列表动态计算函数
const inputs = computed(() => {
  // 2.1 获取节点数据中的开始节点
  const startNode = nodes.value.find((item) => item.type === 'start')

  // 2.2 检查节点数据并返回
  return startNode?.data?.inputs ?? []
})

// 3.定义输出结果动态计算函数
const outputs = computed(() => {
  // 3.1 获取结束节点数据
  const endNodeResult = nodeResults.value.find((item) => item.node_data.node_type === 'end')

  // 3.2 如果存在则表示运行成功
  if (endNodeResult) return endNodeResult.outputs

  // 3.3 否则返回空
  return null
})

// 4.定义整个工作流的响应耗时
const latency = computed(() => {
  return nodeResults.value.reduce((total, item) => total + item.latency, 0)
})

// 5.定义工具/插件响应耗时
const toolLatency = computed(() => {
  return nodeResults.value.reduce((total, item) => {
    if (item.node_data.type === 'tool') {
      total += item.latency
    }
    return total
  }, 0)
})

const handleClick = () => {
  formRef.value.handleSubmit()
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// 6.定义表单提交函数
const onSubmit = async ({ errors }: { errors: Record<string, ValidatedError> | undefined }) => {
  // 6.1 运行前先将历史运行清空
  nodeResults.value = []
  debugError.value = ''
  // 6.2 检查表单是否出错，如果出错则直接结束
  if (errors) return

  // 6.3 将tab选项切换到输出选项卡
  activatedTab.value = 'output'

  try {
    if (store.workflow && store.workflow.id) {
      loading.value = true
      const resp = await WorkFlowApi.debugWorkflow({
        workflowId: store.workflow.id,
        req: { inputs: form.value },
        onData: async (event_response) => {
          const data = event_response?.data
          if (!data) return

          nodeResults.value.push(data)
          const nodeType = data.node_data?.node_type
          const storeKey = nodeTypeMap[nodeType as keyof typeof nodeTypeMap]

          if (storeKey) {
            const key = storeKey as keyof WorkflowStoreType
            store[key] = data
          }
        },
      })

      if (resp) {
        debugError.value = resp.message
      }
      await store.getWorkflow(store.workflow.id)
    }
  } catch (error: any) {
    debugError.value = error.message
  } finally {
    loading.value = false
  }
}

// 可调整宽度的div元素
const resizableDiv = ref<any>(null)
// 拖动按钮元素
const dragBtn = ref(null)
// 记录鼠标按下时的初始X坐标
let startX = 0
// 记录div的初始宽度
let initialWidth = 0

// 开始拖动的事件处理
const startDrag = (e: MouseEvent) => {
  // 阻止默认事件，避免选中文本等
  e.preventDefault()
  // 记录初始鼠标X坐标
  startX = e.clientX
  // 获取div的初始宽度
  initialWidth = resizableDiv.value.offsetWidth

  // 绑定全局的鼠标移动和松开事件
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

// 拖动中的事件处理
const onDrag = (e: MouseEvent) => {
  if (!resizableDiv.value) return
  // 计算鼠标移动的距离
  const moveDistance = -(e.clientX - startX)
  // 计算新的宽度
  const newWidth = initialWidth + moveDistance

  // 设置div的新宽度，最小宽度限制为100px
  resizableDiv.value.style.setProperty('width', Math.max(newWidth, 100) + 'px', 'important')
}

// 停止拖动的事件处理
const stopDrag = () => {
  // 移除全局的鼠标事件监听
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// 7.监听调试模态窗的显示或隐藏
watch(
  () => visible.value,
  (newValue) => {
    if (newValue) {
      nodeResults.value = []
      activatedTab.value = 'input'
      form.value = {}
    }
  },
)

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})
</script>

<template>
  <div
    ref="resizableDiv"
    v-if="visible"
    class="absolute right-0 top-0 bottom-0 w-[400px] min-w-[400px] p-2.5"
  >
    <div
      class="flex flex-col h-full bg-white z-50 p-4 border border-gray-100 shadow-lg rounded-lg relative"
      @click.stop
    >
      <div
        class="drag-btn h-6 w-1 bg-gray-300 rounded-2xl cursor-ew-resize"
        @mousedown="startDrag"
      ></div>
      <!-- 调试面板标题 -->
      <div class="flex items-center justify-between mb-2">
        <!-- 左侧标题 -->
        <div class="text-base font-bold text-gray-700">工作流调试</div>
        <!-- 右侧关闭按钮 -->
        <a-button type="text" size="mini" class="rounded-full" @click="visible = false">
          <template #icon>
            <icon-close class="text-gray-800 font-bold" />
          </template>
        </a-button>
      </div>
      <div class="flex-1 flex flex-col">
        <!-- tab面板 -->
        <div class="flex-1">
          <a-tabs v-model:active-key="activatedTab" :header-padding="false">
            <a-tab-pane
              key="input"
              title="输入"
              class="overflow-y-scroll max-h-[calc(100vh-260px)] scrollbar-w-none"
            >
              <!-- 无输入数据样式 -->
              <a-empty v-if="inputs.length <= 0" class="my-4">该工作流暂无输入数据</a-empty>
              <!-- 有数据的UI -->
              <a-form :model="form" layout="vertical" @submit="onSubmit" ref="formRef">
                <!-- 输入数据表单列表 -->
                <a-form-item
                  v-for="(input, idx) in inputs"
                  :key="idx"
                  :field="input.name"
                  :required="input.required"
                  hide-asterisk
                >
                  <template #label>
                    <div class="flex items-center gap-2">
                      <div class="">{{ input.name }}</div>
                      <div v-if="input.required" class="text-red-700">*</div>
                      <div
                        class="text-xs text-gray-500 bg-gray-200 px-1 py-0.5 rounded flex-shrink-0"
                      >
                        {{ input.type }}
                      </div>
                    </div>
                  </template>
                  <a-input
                    v-if="input.type === 'string'"
                    v-model="form[input.name]"
                    placeholder="请输入参考值"
                    class="rounded-md"
                  />
                  <a-input-number
                    v-else-if="['int', 'float'].includes(input.type)"
                    v-model="form[input.name]"
                    placeholder="请输入参考值"
                    class="rounded-md"
                  />
                  <a-radio-group v-else-if="input.type === 'boolean'" v-model="form[input.name]">
                    <a-radio :value="true">是</a-radio>
                    <a-radio :value="false">否</a-radio>
                  </a-radio-group>
                  <!-- 功能升级:调试窗口新增列表型数据输入，使用普通文本框代替，格式为[xxx, xxx] -->
                  <a-input-tag
                    v-else-if="input.type.startsWith('list')"
                    v-model="form[input.name]"
                    placeholder="请输入参考值列表信息，输入后回车"
                    class="!rounded-lg"
                  />
                </a-form-item>
              </a-form>
            </a-tab-pane>
            <a-tab-pane
              key="output"
              title="输出"
              class="overflow-y-scroll max-h-[calc(100vh-228px)] scrollbar-w-none"
            >
              <!-- 运行中的状态 -->
              <div
                v-if="loading"
                class="flex flex-col gap-2 bg-green-100 rounded-lg border border-green-500 p-3 mb-2"
              >
                <!-- 加载状态 -->
                <div class="flex items-center gap-2">
                  <icon-loading class="text-green-500" />
                  <div class="text-green-500">工作流运行中</div>
                </div>
                <!-- 当前执行完成的节点 -->
                <div
                  v-for="nodeResult in nodeResults"
                  :key="nodeResult.id"
                  class="text-gray-500 text-xs"
                >
                  已成功运行节点【{{ nodeResult?.node_data?.title ?? '-' }}】
                </div>
              </div>
              <!-- 非运行时状态 -->
              <div v-else class="flex flex-col gap-2">
                <!-- 运行失败UI -->
                <div
                  v-if="debugError"
                  class="flex flex-col gap-2 bg-red-100 p-3 rounded-lg border border-red-700"
                >
                  <div class="flex items-center gap-2 text-red-500">
                    <icon-exclamation-circle-fill />
                    <div>工作流运行失败</div>
                  </div>
                  <div class="text-xs text-gray-500">{{ debugError }}</div>
                </div>
                <!-- 运行成功UI -->
                <div
                  v-if="outputs"
                  class="flex flex-col gap-2 bg-green-100 p-3 rounded-lg border border-green-600"
                >
                  <!-- 数据统计 -->
                  <div class="flex items-center gap-2 text-xs">
                    <div class="flex-1 flex flex-col gap-1">
                      <div class="text-gray-500">状态</div>
                      <div class="flex items-center gap-1">
                        <icon-check-circle-fill class="text-xs text-green-600" />
                        <div class="font-semibold text-green-600">运行成功</div>
                      </div>
                    </div>
                    <div class="flex-1 flex flex-col gap-1">
                      <div class="text-gray-500">总消耗</div>
                      <div class="text-gray-700 font-medium">500 Tokens</div>
                    </div>
                    <div class="flex-1 flex flex-col gap-1">
                      <div class="text-gray-500">总用时</div>
                      <div class="text-gray-700 font-medium">{{ latency.toFixed(2) }}s</div>
                    </div>
                  </div>
                </div>
                <!-- 运行结果 -->
                <div v-if="outputs" class="rounded-lg">
                  <vue-json-pretty
                    :data="outputs"
                    show-length
                    :show-line="false"
                    class="overflow-y-scroll scrollbar-w-none flex-1 py-2 text-xs"
                  />
                </div>
              </div>
              <!-- 空数据状态 -->
              <a-empty v-if="!loading && !outputs && !debugError" class="my-4">
                该工作流暂无运行调试结果
              </a-empty>
            </a-tab-pane>
            <a-tab-pane
              v-if="outputs"
              key="outputInfo"
              title="详情"
              class="overflow-y-scroll max-h-[calc(100vh-228px)] scrollbar-w-none"
            >
              <div
                v-if="outputs"
                class="flex flex-col gap-2 bg-green-100 p-3 rounded-lg border border-green-600"
              >
                <!-- 数据统计 -->
                <div class="flex items-center gap-2 text-xs">
                  <div class="flex-1 flex flex-col gap-1">
                    <div class="text-gray-500">状态</div>
                    <div class="flex items-center gap-1">
                      <icon-check-circle-fill class="text-xs text-green-600" />
                      <div class="font-semibold text-green-600">运行成功</div>
                    </div>
                  </div>
                  <div class="flex-1 flex flex-col gap-1">
                    <div class="text-gray-500">总消耗</div>
                    <div class="text-gray-700 font-medium">500 Tokens</div>
                  </div>
                  <div class="flex-1 flex flex-col gap-1">
                    <div class="text-gray-500">总用时</div>
                    <div class="text-gray-700 font-medium">{{ latency.toFixed(2) }}s</div>
                  </div>
                </div>
              </div>
              <CodeEditor
                :code="form ? JSON.stringify(form, null, 2) : '{}'"
                :height="200"
                class="rounded-lg overflow-hidden mt-4"
                language-name="输入"
                language="json"
                :options="{ readOnly: true }"
                :is-plaintext="true"
              />
              <CodeEditor
                :code="outputs ? JSON.stringify(outputs, null, 2) : '{}'"
                :height="200"
                class="rounded-lg overflow-hidden mt-4"
                language-name="输出"
                language="json"
                :options="{ readOnly: true }"
                :is-plaintext="true"
              />
            </a-tab-pane>
          </a-tabs>
        </div>
        <!-- 底部按钮 -->
        <div class="" v-if="activatedTab == 'input'">
          <a-button :loading="loading" type="primary" long class="rounded-lg" @click="handleClick">
            <template #icon>
              <icon-play-arrow-fill />
            </template>
            开始运行
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drag-btn {
  position: absolute;
  top: 50%;
  left: 3px;
  transform: translateY(-50%);
}
</style>
