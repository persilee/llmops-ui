<script setup lang="ts">
import { useScreenshot, type ImageType } from '@/utils/el-to-image'
import { Message } from '@arco-design/web-vue'
import { Panel, type VueFlowStore } from '@vue-flow/core'
import dagre from 'dagre'
import { cloneDeep } from 'lodash-es'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useWorkflowStore } from '../Workflow.store'
import AddNode from './AddNode.vue'
import ZoomDropdown from './ZoomDropdown.vue'

const store = useWorkflowStore()
const props = defineProps<{
  flowInstance: VueFlowStore | undefined
  vueFlowRef: HTMLElement | null
  zoomValue: number
}>()
const mode = defineModel('mode', { type: String, default: 'mouse' })
const imageLoading = ref(false)
const isTriggerModeVisible = ref(false)
const isTriggerImageVisible = ref(false)
const isTriggerNodeVisible = ref(false)
const isdisabledNodeVisible = ref(false)
const { capture } = useScreenshot()
const imageOptions = <{ label: string; value: ImageType }[]>[
  { label: '导出为 PNG', value: 'png' },
  { label: '导出为 JPEG', value: 'jpeg' },
  { label: '导出为 SVG', value: 'svg' },
]
const handleSelectMode = (m: string) => {
  mode.value = m
  store.workflow.mode = m
}

const handleSelectZoom = (option: { label: string; value: number | string }) => {
  if (option.value === 'zoomIn') {
    props.flowInstance?.zoomIn()
  } else if (option.value === 'zoomOut') {
    props.flowInstance?.zoomOut()
  } else if (option.value === 'auto') {
    props.flowInstance?.zoomTo(1)
  } else {
    props.flowInstance?.zoomTo(option.value as number)
  }
}

const handleDownloadImage = async (option: { label: string; value: ImageType }) => {
  if (!props.vueFlowRef) {
    Message.warning('请先加载流程图')
    return
  }
  try {
    imageLoading.value = true
    const filter = (node: HTMLElement) => {
      const exclusionClasses = ['vue-flow__minimap', 'panel-control']
      return !exclusionClasses.some((classname) => node.classList?.contains(classname))
    }
    await capture(props.vueFlowRef, {
      shouldDownload: true,
      type: option.value,
      filter,
    })
  } catch (error) {
    Message.error('导出失败')
  } finally {
    imageLoading.value = false
  }
}

const autoLayout = () => {
  const dagreGraph = new dagre.graphlib.Graph()

  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: 'LR', // 纵向布局
    align: 'UL', // 左上对齐
    nodesep: 80, // 节点间距
    ranksep: 60, // 层次间距
    edgesep: 10, // 边间距
  })

  const cloneNodes = cloneDeep(store.draftGraph.nodes)
  const cloneEdges = cloneDeep(store.draftGraph.edges)

  cloneNodes.forEach((node: any) => {
    dagreGraph.setNode(node.id, { width: node.dimensions.width, height: node.dimensions.height })
  })

  cloneEdges.forEach((edge: any) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  store.draftGraph.nodes = cloneNodes.map((node: any) => {
    const { x, y } = dagreGraph.node(node.id)
    return {
      ...node,
      position: { x, y },
    }
  })
}

const handleDocumentClick = () => {
  isTriggerModeVisible.value = false
  isTriggerImageVisible.value = false
  isTriggerNodeVisible.value = false
  isdisabledNodeVisible.value = false
}

const handleTriggerNodeVisibleChange = (v: boolean) => {
  if (v) {
    isdisabledNodeVisible.value = true
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <panel position="bottom-center" class="bottom-1 panel-control">
    <div class="bg-white rounded-lg px-4 py-1.5 shadow-lg border border-gray-300">
      <div class="flex items-center controls-panel">
        <a-trigger
          v-model:popup-visible="isTriggerModeVisible"
          trigger="click"
          :unmount-on-close="false"
          :popup-translate="[150, -16]"
          position="top"
          @click.stop
        >
          <a-tooltip
            :content="store.workflow.mode == 'mouse' ? '鼠标友好模式' : '触摸板友好模式'"
            :class="`${isTriggerModeVisible ? 'hidden' : 'block'}`"
          >
            <a-button type="text" size="mini" class="px-1 mr-2">
              <template #icon>
                <img v-if="mode == 'mouse'" src="@/assets/images/icon-mouse.svg" class="w-4" />
                <img v-else src="@/assets/images/icon-pan.svg" class="w-4" />
              </template>
              <icon-down
                :class="`text-gray-700 w-3 h-3 transform duration-160 ${isTriggerModeVisible == false ? '' : 'rotate-180'}`"
              />
            </a-button>
          </a-tooltip>
          <template #content>
            <div class="flex flex-col rounded-lg shadow-lg p-4 bg-white border border-gray-100">
              <div class="text-gray-900 text-lg font-bold mb-3">交互模式</div>
              <div class="flex gap-3">
                <div
                  :class="`flex flex-col w-[166px] items-center justify-center border rounded-lg px-3 py-6 cursor-pointer ${mode == 'mouse' ? 'border-blue-600' : 'border-gray-300 hover:shadow-sm'}`"
                  @click="handleSelectMode('mouse')"
                >
                  <img src="@/assets/images/icon-mouse.svg" class="h-[60px] mb-4" />
                  <div class="text-gray-900 text-base font-bold">鼠标友好模式</div>
                  <div class="text-gray-500 mt-2">鼠标左键拖动画布，滚轮缩放</div>
                </div>
                <div
                  :class="`flex flex-col w-[166px] items-center justify-center border rounded-lg px-3 py-6 cursor-pointer ${mode == 'pan' ? 'border-blue-600' : 'border-gray-300 hover:shadow-sm'}`"
                  @click="handleSelectMode('pan')"
                >
                  <img src="@/assets/images/icon-pan.svg" class="h-[60px] mb-4" />
                  <div class="text-gray-900 text-base font-bold">触控板友好模式</div>
                  <div class="text-gray-500 mt-2">双指同向移动拖动，双指张开捏合缩放</div>
                </div>
              </div>
            </div>
          </template>
        </a-trigger>
        <a-tooltip content="画布模式"> </a-tooltip>
        <ZoomDropdown @select="handleSelectZoom" :zoom-value="zoomValue" />
        <a-tooltip content="优化布局">
          <a-button type="text" size="small" class="mx-1.5" @click="autoLayout">
            <template #icon> <icon-apps class="text-gray-700 w-4 h-4" /></template>
          </a-button>
        </a-tooltip>

        <a-trigger
          v-model:popup-visible="isTriggerImageVisible"
          trigger="click"
          :unmount-on-close="false"
          :popup-translate="[0, -16]"
          position="top"
          @click.stop
        >
          <a-tooltip content="导出为图片" :class="`${isTriggerImageVisible ? 'hidden' : 'block'}`">
            <a-button :loading="imageLoading" type="text" size="small" class="mr-1.5">
              <template #icon> <icon-image class="text-gray-700 w-4 h-4" /></template>
            </a-button>
          </a-tooltip>
          <template #content>
            <div class="px-1 py-2 bg-white rounded-md shadow-sm border border-gray-200">
              <div
                :value="option"
                v-for="option in imageOptions"
                :key="option.value"
                class="py-2 px-3 cursor-pointer hover:bg-gray-100 rounded-md"
                @click="handleDownloadImage(option)"
              >
                {{ option.label }}
              </div>
            </div>
          </template>
        </a-trigger>
        <a-tooltip content="缩略图">
          <a-button
            type="text"
            size="small"
            :class="`${store.workflow.isShowMap ? 'bg-blue-200 text-blue-600' : ''}`"
            @click="store.workflow.isShowMap = !store.workflow.isShowMap"
          >
            <template #icon>
              <icon-layers
                :class="`w-4 h-4 ${store.workflow.isShowMap ? 'text-blue-600' : 'text-gray-700'}`"
            /></template>
          </a-button>
        </a-tooltip>
        <a-divider direction="vertical" />
        <a-trigger
          v-model:popup-visible="isTriggerNodeVisible"
          trigger="hover"
          :disabled="isdisabledNodeVisible"
          :unmount-on-close="false"
          :popup-translate="[0, -16]"
          position="top"
          @popup-visible-change="handleTriggerNodeVisibleChange"
          @click.stop
        >
          <a-button type="primary" class="rounded-md" size="small">
            <template #icon><icon-plus /></template>
            添加节点
          </a-button>
          <template #content>
            <AddNode />
          </template>
        </a-trigger>
        <a-divider direction="vertical" />
        <a-button type="text" class="rounded-md pl-1 pr-2" size="small">
          <template #icon><icon-play-arrow-fill /></template>
          调试
        </a-button>
      </div>
    </div>
  </panel>
</template>

<style scoped></style>
