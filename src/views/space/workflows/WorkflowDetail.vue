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
  type NodeMouseEvent,
  type ViewportTransform,
  type VueFlowStore,
} from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/minimap/dist/style.css'
import { cloneDeep, debounce } from 'lodash-es'
import { v4 } from 'uuid'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useSpaceStore } from '../SpaceView.store'
import ControlsPanel from './components/ControlsPanel.vue'
import EdgeWithPlus from './components/EdgeWithPlus.vue'
import HelperLines from './components/HelperLines.vue'

import DebugModel from './components/DebugModel.vue'
import DatasetRetrievalNodeInfo from './components/infos/DatasetRetrievalNodeInfo.vue'
import EndNodeInfo from './components/infos/EndNodeInfo.vue'
import LLMNodeInfo from './components/infos/LLMNodeInfo.vue'
import StartNodeInfo from './components/infos/StartNodeInfo.vue'
import ToolNodeInfo from './components/infos/ToolNodeInfo.vue'
import WorkflowHeader from './components/WorkflowHeader.vue'
import WorkflowModel from './components/WorkflowModel.vue'
import { useWorkflowStore } from './Workflow.store'

const { vueFlowRef, nodes, onPaneReady, onConnect, findNode, applyNodeChanges, getConnectedEdges } =
  useVueFlow()
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
const highlightedEdges = ref<string[]>([])
const debugModelVisible = ref(false)
const selectNode = ref<any>(null)
const nodeInfoVisible = ref(false)

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

const handlePaneClick = (event: MouseEvent) => {
  handleCloseNodeInfo()
}
const handleEdgeClick = (event: EdgeMouseEvent) => {
  handleCloseNodeInfo()
}
const handleNodeClick = (event: NodeMouseEvent) => {
  debugModelVisible.value = false
  if (!selectNode.value || selectNode.value.id !== event.node.id) {
    selectNode.value = event.node
    nodeInfoVisible.value = true
  }
}

const handleViewportChange = (viewport: ViewportTransform) => {
  debounce(() => {
    zoomValue.value = Number(viewport.zoom)
  }, 360)()
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
    Message.warning('不能将节点连接到本身')
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
    Message.warning('这两个节点已有连接，无需重复添加')
    return
  }

  // 获取边的起点和终点类型
  const sourceNode = findNode(source)
  const targetNode = findNode(target)

  // 将数据添加到edges
  store.draftGraph.edges.push({
    ...connection,
    id: v4(),
    source_type: sourceNode?.type,
    source_handle_id: connection?.sourceHandle,
    target_type: targetNode?.type,
    animated: true,
    type: 'custom',
    style: { fill: 'none' },
  })
})

const handleNodeMouseEnter = (event: NodeMouseEvent) => {
  const connectedEdges = getConnectedEdges(event.node.id)
  highlightedEdges.value = connectedEdges.map((edge) => edge.id)
}

const handleNodeMouseLeave = () => {
  highlightedEdges.value = []
}

const handleUpdateGraph = () => {
  if (isInit.value) return

  if (store.workflow && store.workflow.id && flowInstance.value) {
    store.updateDraftGraph(store.workflow?.id, {
      edges: store.draftGraph.edges,
      nodes: store.draftGraph.nodes,
    })
  }
}

const handleUpdateNode = (node_data: Record<string, any>) => {
  // 获取该节点对应的索引
  const idx = nodes.value.findIndex((item: any) => item.id === node_data.id)

  // 检测是否存在数据，如果存在则更新
  if (idx !== -1) {
    nodes.value[idx].data = {
      ...nodes.value[idx].data,
      ...node_data,
    }

    // 检测节点类型是否为意图识别，如果是则同步更新edges边信息
    if ('classes' in node_data) {
      // 提取意图世界节点中存在的source_handle_id列表
      const source_handle_ids = node_data.classes.map((item: any) => item.source_handle_id)
      const cloneEdges = cloneDeep(store.draftGraph.edges)

      // 循环遍历所有边并剔除
      for (let i = cloneEdges.length - 1; i >= 0; i--) {
        const edge = cloneEdges[i]
        if (edge.source === node_data.id && source_handle_ids.indexOf(edge.sourceHandle) === -1) {
          // 分类被剔除，则删除对应的边信息
          cloneEdges.splice(i, 1)
        }
      }

      // 重新赋值edges信息
      store.draftGraph.edges = cloneEdges
    }
  }

  if (store.workflow && store.workflow.id && flowInstance.value) {
    store.updateDraftGraph(store.workflow?.id, {
      edges: store.draftGraph.edges,
      nodes: store.draftGraph.nodes,
    })
  }
}

const handleCloseNodeInfo = () => {
  selectNode.value = null
  nodeInfoVisible.value = false
}

const handleDebugClick = () => {
  selectNode.value = null
  nodeInfoVisible.value = false
  debugModelVisible.value = true
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
    <div class="flex-1 relative">
      <a-spin :loading="loading" class="w-full h-full">
        <vue-flow
          v-model:nodes="store.draftGraph.nodes"
          v-model:edges="store.draftGraph.edges"
          :node-types="store.NOTE_TYPES"
          :min-zoom="0.25"
          :max-zoom="2"
          :zoom-on-scroll="store.mode == 'mouse'"
          :pan-on-scroll="store.mode == 'pan'"
          :pan-on-drag="store.mode == 'mouse'"
          :nodes-connectable="true"
          :connection-mode="ConnectionMode.Strict"
          @nodes-change="onNodesChange"
          @pane-click.prevent="handlePaneClick"
          @node-click="handleNodeClick"
          @edge-click="handleEdgeClick"
          @viewport-change="handleViewportChange"
          @edge-mouse-enter="handleEdgeMouseEnter"
          @edge-mouse-leave="handleEdgeMouseLeave"
          @node-mouse-enter="handleNodeMouseEnter"
          @node-mouse-leave="handleNodeMouseLeave"
          @update:edges="handleUpdateGraph"
          @update:nodes="handleUpdateGraph"
          @node-drag-stop="handleUpdateGraph"
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
            @debug-click="handleDebugClick"
          />
          <!-- 自定义边 -->
          <template #edge-custom="edgeProps">
            <EdgeWithPlus
              v-bind="edgeProps"
              :is-hovered="hoveredEdgeId === edgeProps.id"
              :highlighted="highlightedEdges.includes(edgeProps.id)"
            />
          </template>
        </vue-flow>
      </a-spin>
      <!-- 调试面板 -->
      <DebugModel v-model:visible="debugModelVisible" />
      <!-- 开始节点详情-->
      <StartNodeInfo
        v-if="selectNode && selectNode.type == 'start'"
        v-model:visible="nodeInfoVisible"
        :node="selectNode"
        @close-node-info="handleCloseNodeInfo"
        @update-node="handleUpdateNode"
      />
      <!-- 知识库节点详情-->
      <DatasetRetrievalNodeInfo
        v-if="selectNode && selectNode.type == 'dataset_retrieval'"
        v-model:visible="nodeInfoVisible"
        :node="selectNode"
        @close-node-info="handleCloseNodeInfo"
        @update-node="handleUpdateNode"
      />
      <!-- 大语言模型节点详情 -->
      <LLMNodeInfo
        v-if="selectNode && selectNode.type == 'llm'"
        v-model:visible="nodeInfoVisible"
        :node="selectNode"
        @close-node-info="handleCloseNodeInfo"
        @update-node="handleUpdateNode"
      />
      <!-- 工具节点详情 -->
      <ToolNodeInfo
        v-if="selectNode && selectNode.type == 'tool'"
        v-model:visible="nodeInfoVisible"
        :node="selectNode"
        @close-node-info="handleCloseNodeInfo"
        @update-node="handleUpdateNode"
      />
      <!-- 结束节点详情 -->
      <EndNodeInfo
        v-if="selectNode && selectNode.type == 'end'"
        v-model:visible="nodeInfoVisible"
        :node="selectNode"
        @close-node-info="handleCloseNodeInfo"
        @update-node="handleUpdateNode"
      />
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

:deep(.custom-edge-path.highlighted) {
  stroke: #1447e6 !important;
  stroke-width: 2px !important;
  transition: stroke-width 0.3s ease-in-out;
}

:deep(.hovered.vue-flow__edge-path) {
  stroke-width: 2px;
  stroke: #1447e6;
  transition: stroke-width 0.3s ease-in-out;
}
</style>
