<script setup lang="ts">
import { getHelperLines } from '@/utils/helper-lines'
import { Message } from '@arco-design/web-vue'
import { Background } from '@vue-flow/background'
import {
  ConnectionMode,
  useVueFlow,
  VueFlow,
  type EdgeMouseEvent,
  type GraphNode,
  type NodeChange,
  type ViewportTransform,
  type VueFlowStore,
} from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/minimap/dist/style.css'
import { debounce } from 'lodash-es'
import { v4 } from 'uuid'
import { markRaw, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useSpaceStore } from '../SpaceView.store'
import ControlsPanel from './components/ControlsPanel.vue'
import EdgeWithPlus from './components/EdgeWithPlus.vue'
import HelperLines from './components/HelperLines.vue'
import CodeNode from './components/nodes/CodeNode.vue'
import DatasetRetrievalNode from './components/nodes/DatasetRetrievalNode.vue'
import EndNode from './components/nodes/EndNode.vue'
import HttpRequestNode from './components/nodes/HttpRequestNode.vue'
import IterationNode from './components/nodes/IterationNode.vue'
import LLMNode from './components/nodes/LLMNode.vue'
import QuestionClassifierNode from './components/nodes/QuestionClassifierNode.vue'
import StartNode from './components/nodes/StartNode.vue'
import TemplateTransformNode from './components/nodes/TemplateTransformNode.vue'
import ToolNode from './components/nodes/ToolNode.vue'
import WorkflowHeader from './components/WorkflowHeader.vue'
import WorkflowModel from './components/WorkflowModel.vue'
import { useWorkflowStore } from './Workflow.store'

const { onPaneReady, vueFlowRef, onConnect, findNode, nodes, applyNodeChanges } = useVueFlow()
const loading = ref(false)
const headerLoading = ref(false)
const store = useWorkflowStore()
const spaceStore = useSpaceStore()
const flowInstance = ref<VueFlowStore>()
const route = useRoute()
const zoomValue = ref(1)
const hoveredEdgeId = ref<string | null>(null)
const isInit = ref(true)
const helperLineHorizontal = ref<number | undefined>(undefined)
const helperLineVertical = ref<number | undefined>(undefined)

const fetchData = async () => {
  try {
    loading.value = true
    if (!store.workflow) {
      headerLoading.value = true
      await store.getWorkflow(route.params.workflowId as string)
    }
    await store.getDraftGraph(store.workflow?.id ?? (route.params.workflowId as string))
  } catch (error) {
  } finally {
    loading.value = false
    headerLoading.value = false
  }
}

const handleSuccess = async () => {
  try {
    headerLoading.value = true
    await store.getWorkflow(route.params.workflowId as string)
  } catch (error) {
  } finally {
    headerLoading.value = false
  }
}

onPaneReady((vueFlowInstance) => {
  vueFlowInstance.fitView()
  flowInstance.value = vueFlowInstance
  flowInstance.value.zoomTo(1)
})

const handlePaneClick = (paneMouseEvent: MouseEvent) => {}

const handleViewportChange = (viewport: ViewportTransform) => {
  debounce(() => {
    zoomValue.value = Number(viewport.zoom)
  }, 360)()
}

const NOTE_TYPES = {
  start: markRaw(StartNode),
  llm: markRaw(LLMNode),
  tool: markRaw(ToolNode),
  dataset_retrieval: markRaw(DatasetRetrievalNode),
  template_transform: markRaw(TemplateTransformNode),
  http_request: markRaw(HttpRequestNode),
  code: markRaw(CodeNode),
  question_classifier: markRaw(QuestionClassifierNode),
  iteration: markRaw(IterationNode),
  end: markRaw(EndNode),
}

function updateHelperLines(changes: NodeChange[], nodes: GraphNode[]) {
  helperLineHorizontal.value = undefined
  helperLineVertical.value = undefined

  if (
    changes.length === 1 &&
    changes[0].type === 'position' &&
    changes[0].dragging &&
    changes[0].position
  ) {
    const helperLines = getHelperLines(changes[0], nodes)

    changes[0].position.x = helperLines.snapPosition.x ?? changes[0].position.x
    changes[0].position.y = helperLines.snapPosition.y ?? changes[0].position.y

    helperLineHorizontal.value = helperLines.horizontal
    helperLineVertical.value = helperLines.vertical
  }

  return changes
}

const onNodesChange = (changes: NodeChange[]) => {
  const updatedChanges = updateHelperLines(changes, nodes.value as GraphNode[])
  nodes.value = applyNodeChanges(updatedChanges)
}

const handleEdgeMouseEnter = (event: EdgeMouseEvent) => {
  hoveredEdgeId.value = event.edge.id
}

const handleEdgeMouseLeave = (event: EdgeMouseEvent) => {
  if (hoveredEdgeId.value === event.edge.id) {
    hoveredEdgeId.value = null
  }
}

onConnect((connection) => {
  // 获取节点和目标的节点id
  const { source, target } = connection

  // 检查是否连接统一节点
  if (source === target) {
    Message.error('不能将节点连接到本身')
    return
  }

  // 检查节点和目标节点是否已经存在链接
  const isAlreadyConnected = store.draftGraph.edges.some((edge: any) => {
    return (
      ((edge.source === source && edge.target === target) ||
        (edge.source === target && edge.target === source)) &&
      connection.sourceHandle === null
    )
  })

  // 如果已经连接，则提示用户并阻止连接
  if (isAlreadyConnected) {
    Message.error('这两个节点已有连接，无需重复添加')
    return
  }

  // 获取边的起点和终点类型
  const source_node = findNode(source)
  const target_node = findNode(target)

  // 将数据添加到edges
  store.draftGraph.edges.push({
    ...connection,
    id: v4(),
    source_type: source_node?.type,
    source_handle_id: connection?.sourceHandle,
    target_type: target_node?.type,
    animated: true,
    type: 'custom',
  })
})

const handleUpdate = () => {
  if (isInit.value) return

  if (store.workflow && store.workflow.id && flowInstance.value) {
    store.updateDraftGraph(store.workflow?.id, {
      edges: store.draftGraph.edges,
      nodes: store.draftGraph.nodes,
    })
  }
}

onMounted(async () => {
  await fetchData()
  isInit.value = false
})
</script>

<template>
  <div class="min-h-screen flex flex-col h-full overflow-hidden">
    <!-- 顶部导航 -->
    <WorkflowHeader :header-loading="headerLoading" />
    <!-- 工作流图 -->
    <div class="flex-1">
      <a-spin :loading="loading" class="w-full h-full">
        <vue-flow
          v-model:nodes="store.draftGraph.nodes"
          v-model:edges="store.draftGraph.edges"
          :node-types="NOTE_TYPES"
          :min-zoom="0.25"
          :max-zoom="2"
          :zoom-on-scroll="store.mode == 'mouse'"
          :pan-on-scroll="store.mode == 'pan'"
          :pan-on-drag="store.mode == 'mouse'"
          :nodes-connectable="true"
          :connection-mode="ConnectionMode.Strict"
          @nodes-change="onNodesChange"
          @pane-click.prevent="handlePaneClick"
          @viewport-change="handleViewportChange"
          @edge-mouse-enter="handleEdgeMouseEnter"
          @edge-mouse-leave="handleEdgeMouseLeave"
          @update:edges="handleUpdate"
          @update:nodes="handleUpdate"
          @node-drag-stop="handleUpdate"
        >
          <!-- 背景 -->
          <background variant="dots" :size="1.2" :gap="20" />
          <!-- 缩略图 -->
          <mini-map
            v-if="store.isShowMap"
            :width="150"
            :height="120"
            :node-border-radius="8"
            :node-color="(node) => '#ddd'"
            :node-stroke-color="(node) => '#999'"
            mask-color="#f6f3f4"
            pannable
            zoomable
            class="rounded-lg border border-gray-300 overflow-hidden left-2 bottom-2 right-auto shadow-lg"
          />
          <!-- 辅助线 -->
          <HelperLines :horizontal="helperLineHorizontal" :vertical="helperLineVertical" />
          <!-- 底部的控制栏 -->
          <ControlsPanel
            v-model:mode="store.mode"
            :flow-instance="flowInstance"
            :vue-flow-ref="vueFlowRef"
            :zoom-value="zoomValue"
          />
          <!-- 自定义边 -->
          <template #edge-custom="edgeProps">
            <EdgeWithPlus v-bind="edgeProps" :is-hovered="hoveredEdgeId === edgeProps.id" />
          </template>
        </vue-flow>
      </a-spin>
    </div>

    <!-- 工作流信息弹窗（更新工作流） -->
    <WorkflowModel
      v-model:visible="spaceStore.workflowModal.isOpen"
      :workflow="store.workflow"
      @success="handleSuccess"
    />
  </div>
</template>

<style scoped>
:deep(.vue-flow__edge.selected .vue-flow__edge-path) {
  stroke: #1447e6 !important;
}

:deep(.vue-flow__edge-path) {
  stroke-width: 2px;
  stroke: #9ca3af;
}

:deep(.hovered.vue-flow__edge-path) {
  stroke-width: 2px;
  stroke: #1447e6;
  transition: stroke-width 0.3s ease-in-out;
}
</style>
