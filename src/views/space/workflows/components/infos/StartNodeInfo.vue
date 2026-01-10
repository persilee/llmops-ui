<script setup lang="ts">
import { cloneDeep } from 'lodash'
import { ref, watch, type PropType } from 'vue'

import AddInputModal from './AddInputModal.vue'

// 1.定义自定义组件所需数据
const props = defineProps({
  node: {
    type: Object as PropType<Record<string, any>> | null,
    default: () => {},
  },
  loading: { type: Boolean, required: false, default: false },
})
const visible = defineModel('visible', { type: Boolean, default: false })
const emits = defineEmits(['updateNode', 'closeNodeInfo'])
const form = ref<Record<string, any>>({})
const addInputModalVisible = ref(false)
const selectedInputIdx = ref<number>(-1)

const addFormInputField = () => {
  addInputModalVisible.value = true
}

const removeFormInputField = (idx: number) => {
  form.value?.inputs?.splice(idx, 1)
  updateNode()
}

const editFormInputField = (idx: number) => {
  selectedInputIdx.value = idx
  addInputModalVisible.value = true
}

const handleUpdateInput = (inputData: Record<string, any>) => {
  if (selectedInputIdx.value === -1) {
    form.value.inputs.push(inputData)
  } else {
    form.value.inputs[selectedInputIdx.value] = inputData
  }
  updateNode()
  selectedInputIdx.value = -1
}

const updateNode = () => {
  const cloneNode = cloneDeep(props.node)
  emits('updateNode', {
    id: cloneNode.id,
    title: form.value.title,
    description: form.value.description,
    inputs: cloneDeep(form.value.inputs),
  })
}

watch(
  () => props.node,
  (newNode) => {
    form.value = {
      id: newNode.id,
      type: newNode.type,
      title: newNode.data.title,
      description: newNode.data.description,
      inputs: [...cloneDeep(newNode.data.inputs)],
    }
  },
  { immediate: true },
)
</script>

<template>
  <div v-if="visible" class="absolute right-0 top-0 bottom-0 w-[400px] p-2.5">
    <div
      class="flex flex-col h-full p-4 bg-white z-50 border border-gray-100 shadow-lg rounded-lg relative"
      @click.stop
    >
      <div class="flow-node-info__bg w-full h-[120px] absolute top-0 left-0 rounded-xl z-0"></div>
      <div class="z-100 h-full">
        <!-- 顶部标题信息 -->
        <div class="flex items-center justify-between gap-3 mb-2">
          <!-- 左侧标题 -->
          <div class="flex items-center gap-2 mb-1">
            <a-avatar shape="square" :size="26" class="bg-blue-700 rounded-lg flex-shrink-0">
              <icon-home />
            </a-avatar>
            <div class="text-gray-700 font-semibold text-base">开始</div>
          </div>
          <!-- 右侧关闭按钮 -->
          <a-button
            type="text"
            size="mini"
            class="rounded-full hover:shadow-sm"
            @click="emits('closeNodeInfo')"
          >
            <template #icon>
              <icon-close class="text-gray-800 font-bold" />
            </template>
          </a-button>
        </div>
        <!-- 描述信息 -->
        <div class="text-xs text-gray-500">工作流的起点节点，支持定义工作流的起点输入等信息</div>
        <!-- 分隔符 -->
        <a-divider class="my-3.5" />
        <!-- 输入数据容器 -->
        <div
          class="h-full flex flex-col overflow-y-scroll max-h-[calc(100vh-210px)] scrollbar-w-none"
        >
          <!-- 容器header -->
          <div class="flex items-center justify-between mb-2">
            <!-- 左侧标题 -->
            <div class="flex items-center gap-2 text-gray-700 font-semibold">
              <div class="">输入参数</div>
              <a-tooltip
                content="定义组件运行时的输入参数，大模型调用该组件时，将根据此信息抽取输入参数"
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
          <!-- 输入数据列表容器 -->
          <div class="flex-1 flex flex-col gap-2">
            <!-- 输入参数 -->
            <div
              v-for="(input, idx) in form.inputs"
              :key="idx"
              class="flex items-center justify-between border border-gray-200 py-1 pr-2 pl-1 rounded-md cursor-pointer hover:shadow-sm group duration-150"
            >
              <div class="flex items-center gap-0.5">
                <img src="@/assets/images/icon-var.svg" class="w-5.5 h-5.5" />
                <div class="flex items-center gap-1">
                  <div class="font-medium text-gray-700">{{ input.name }}</div>
                  <div class="text-gray-500 font-bold">· {{ input.type }}</div>
                </div>
              </div>
              <div
                class="opacity-0 invisible flex items-center group-hover:opacity-100 group-hover:visible"
              >
                <a-button type="text" size="small" @click="editFormInputField(Number(idx))">
                  <template #icon><icon-edit class="text-gray-600" /></template>
                </a-button>
                <a-button type="text" size="small" @click="removeFormInputField(Number(idx))">
                  <template #icon><icon-delete class="text-red-600" /></template>
                </a-button>
              </div>
              <div
                v-if="input.required"
                class="text-gray-500 text-xs group-hover:hidden duration-150"
              >
                必填
              </div>
            </div>
            <!-- 没数据UI -->
            <a-empty v-if="form.inputs?.length <= 0" class="my-4">该节点暂无输入数据</a-empty>
          </div>
        </div>
      </div>
    </div>
    <AddInputModal
      v-model:visible="addInputModalVisible"
      :input-data="selectedInputIdx != -1 ? form.inputs[selectedInputIdx] : null"
      @update-input="handleUpdateInput"
    />
  </div>
</template>

<style scoped>
.flow-node-info__bg {
  background: linear-gradient(#1449e616 0%, transparent 80%);
}
</style>
