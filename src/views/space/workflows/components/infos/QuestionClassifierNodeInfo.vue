<script setup lang="ts">
import { type TextareaInstance } from '@arco-design/web-vue'
import { useVueFlow } from '@vue-flow/core'
import { cloneDeep, isEqual } from 'lodash'
import { v4 } from 'uuid'
import { computed, ref, watch, type PropType } from 'vue'
import { useWorkflowStore } from '../../Workflow.store'
import NodeRunResult from './NodeRunResult.vue'

// 1.定义自定义组件所需数据
const props = defineProps({
  node: {
    type: Object as PropType<Record<string, any>> | null,
    default: () => {},
  },
})

const emits = defineEmits(['updateNode', 'closeNodeInfo'])
const visible = defineModel('visible', { type: Boolean, default: false })
const form = ref<Record<string, any>>({})
const { nodes, edges } = useVueFlow()
const store = useWorkflowStore()
const descriptionVisible = ref(false)
const descriptionRef = ref<TextareaInstance | null>(null)

// 定义输入变量引用选项
const inputRefOptions = computed(() => {
  return store.getReferencedVariables(cloneDeep(nodes.value), cloneDeep(edges.value), props.node.id)
})

const activatedTab = computed({
  get: () => (store.isNodeDebugRunning ? 'running' : 'setting'),
  set: (val) => {
    store.isNodeDebugRunning = val === 'running'
  },
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

// 定义添加问题分类字段函数
const addClass = () => {
  form.value?.classes.push({
    query: '',
    node_id: '',
    node_type: '',
    source_handle_id: v4(),
  })
  handleUpdateNodeInfo()
}

// 定义移除问题分类
const removeClass = (idx: number) => {
  form.value?.classes?.splice(idx, 1)
  handleUpdateNodeInfo()
}

const handleUpdateNodeInfo = () => {
  store.isDebug = false
  const node = nodeToFrom(props.node)
  if (isEqual(node, form.value)) return

  // 深度拷贝表单数据内容
  const cloneInputs = cloneDeep(form.value.inputs)
  const cloneClasses = cloneDeep(form.value.classes)

  //  数据校验通过，通过事件触发数据更新
  emits('updateNode', {
    id: props.node.id,
    title: form.value.title,
    description: form.value.description,
    classes: cloneClasses,
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
  const cloneClasses = cloneDeep(newNode.data.classes)

  return {
    id: newNode.id,
    type: newNode.type,
    title: newNode.data.title,
    description: newNode.data.description,
    classes: cloneClasses,
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
        content: input.value.type === 'literal' ? input.value.content : null, // 变量值内容
        ref: input.value.type === 'ref' && refExists ? ref : '', // 变量引用信息，存储引用节点id+引用变量名
      }
    }),
    outputs: [],
  }
}

// 7.监听数据，将数据映射到表单模型上
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
            <a-avatar :size="26" shape="square" class="bg-green-700 rounded-lg flex-shrink-0">
              <icon-mind-mapping :size="16" />
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
                    <div class="">输入数据</div>
                    <a-tooltip
                      content="传递给LLM的相关数据，LLM会根据该数据自行判断需要执行的路由线路。"
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
                <div
                  v-for="(input, idx) in form?.inputs"
                  :key="idx"
                  class="flex items-start justify-center gap-1"
                >
                  <div class="w-[20%] flex-shrink-0">
                    <div class="text-xs text-gray-500">{{ input.name }}</div>
                  </div>
                  <div class="w-[25%] flex-shrink-0">
                    <a-select
                      size="mini"
                      v-model="input.type"
                      class="px-2"
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
                      @change="handleUpdateNodeInfo"
                    />
                  </div>
                  <div class="flex flex-col w-[55%] items-start">
                    <div class="flex items-center gap-1">
                      <a-input-tag
                        v-if="input.type.startsWith('list')"
                        size="mini"
                        v-model="input.content"
                        :default-value="[]"
                        placeholder="请输入参数值"
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
                    <div v-if="!input.content && store.isDebug" class="text-red-500 text-xs mt-1">
                      参数值不能为空
                    </div>
                  </div>
                </div>
              </div>
              <a-divider class="my-4" />
              <!-- 问题分类 -->
              <div class="flex flex-col gap-2">
                <!-- 标题&操作按钮 -->
                <div class="flex items-center justify-between">
                  <!-- 左侧标题 -->
                  <div class="flex items-center gap-2 text-gray-700 font-semibold">
                    <div class="">问题分类</div>
                    <a-tooltip content="设置不同的问题分类，LLM会根据query自动选择对应的路由。">
                      <icon-question-circle />
                    </a-tooltip>
                  </div>
                  <!-- 右侧新增问题按钮 -->
                  <a-button
                    type="text"
                    size="mini"
                    class="!text-gray-700"
                    @click="() => addClass()"
                  >
                    <template #icon>
                      <icon-plus />
                    </template>
                  </a-button>
                </div>
                <div
                  v-for="(classifier, idx) in form?.classes"
                  :key="idx"
                  class="bg-white border border-gray-300 p-3 rounded-xl mb-2"
                >
                  <!-- 分类标题&操作按钮 -->
                  <div class="flex items-center justify-between mb-2">
                    <!-- 左侧标题 -->
                    <div class="font-bold text-gray-700">分类{{ Number(idx) + 1 }}</div>
                    <!-- 右侧操作按钮 -->
                    <div class="">
                      <a-button
                        type="text"
                        size="mini"
                        class="text-gray-700 hover:text-red-600"
                        @click="() => removeClass(Number(idx))"
                      >
                        <template #icon>
                          <icon-delete />
                        </template>
                      </a-button>
                    </div>
                  </div>
                  <!-- 分类输入数据 -->
                  <a-textarea
                    v-model="classifier.query"
                    class="rounded-lg"
                    placeholder="在这里输入你的主题内容"
                  />
                </div>
                <!-- 空数据状态 -->
                <a-empty v-if="form?.classes.length <= 0" class="my-4">该节点暂无分类数据</a-empty>
              </div>
            </a-form>
          </a-tab-pane>
          <NodeRunResult
            :node-result="store.questionClassifierNodeResult"
            :loading="store.nodeDebugLoading"
          />
        </a-tabs>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
