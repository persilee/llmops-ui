<script setup lang="ts">
import { Background } from '@vue-flow/background'
import { useVueFlow, VueFlow, type ViewportTransform, type VueFlowStore } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/minimap/dist/style.css'
import { debounce } from 'lodash-es'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useSpaceStore } from '../SpaceView.store'
import ControlsPanel from './components/ControlsPanel.vue'
import WorkflowHeader from './components/WorkflowHeader.vue'
import WorkflowModel from './components/WorkflowModel.vue'
import { useWorkflowStore } from './Workflow.store'

const { onPaneReady, vueFlowRef } = useVueFlow()
const loading = ref(false)
const headerLoading = ref(false)
const store = useWorkflowStore()
const spaceStore = useSpaceStore()
const flowInstance = ref<VueFlowStore>()
const route = useRoute()
const zoomValue = ref(1)

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

const customEvents = {
  // 自定义点击事件处理
  click: (event: Event) => {
    // 允许事件冒泡
    return true
  },
}
const handlePaneClick = (paneMouseEvent: MouseEvent) => {}

const handleViewportChange = (viewport: ViewportTransform) => {
  debounce(() => {
    zoomValue.value = Number(viewport.zoom)
  }, 360)()
}

onMounted(() => {
  fetchData()
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
          :min-zoom="0.25"
          :max-zoom="2"
          :zoom-on-scroll="store.workflow.mode == 'mouse'"
          :pan-on-scroll="store.workflow.mode == 'pan'"
          @pane-click.prevent="handlePaneClick"
          @viewport-change="handleViewportChange"
        >
          <background variant="dots" :size="1.2" :gap="20" />
          <mini-map
            v-if="store.workflow.isShowMap"
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
          <ControlsPanel
            v-model:mode="store.workflow.mode"
            :flow-instance="flowInstance"
            :vue-flow-ref="vueFlowRef"
            :zoom-value="zoomValue"
          />
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

<style scoped></style>
