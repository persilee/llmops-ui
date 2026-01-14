<script setup lang="ts">
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useVueFlow,
  type EdgeProps,
} from '@vue-flow/core'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useWorkflowStore } from '../Workflow.store'
import AddNode from './AddNode.vue'

// 定义组件属性
const props = defineProps<EdgeProps & { highlighted: boolean }>()
const isTriggerNodeVisible = ref(false)
const store = useWorkflowStore()

const isHovered = defineModel('isHovered', { type: Boolean, default: false })

// 解构出 onEdgeClick, onNodeClick, onPaneClick 方法，用于处理点击事件
const { onEdgeClick, onNodeClick, onPaneClick } = useVueFlow()

// 计算edge路径和中心位置
const path = computed(() =>
  getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
    curvature: 0.5, // 贝塞尔曲线曲率
  }),
)

const handleMouseOver = () => {
  isHovered.value = true
}
const handleMouseOut = () => {
  if (isTriggerNodeVisible.value) return
  isHovered.value = false
}

onEdgeClick(() => {
  isTriggerNodeVisible.value = false
})

onNodeClick(() => {
  isTriggerNodeVisible.value = false
})

onPaneClick(() => {
  isTriggerNodeVisible.value = false
})

const handleClick = (e: MouseEvent) => {
  store.showedAddNode = props.id
}

const stop = watch(
  () => isTriggerNodeVisible.value,
  (val) => {
    if (!val) {
      isHovered.value = false
    }
  },
)

onUnmounted(() => {
  stop()
})
</script>

<template>
  <!-- 使用BaseEdge渲染基础的edge路径 -->
  <BaseEdge
    :id="id"
    :style="style"
    :path="path[0]"
    :marker-end="markerEnd"
    :class="`custom-edge-path ${isHovered || isTriggerNodeVisible ? 'hovered' : ''} ${highlighted ? 'highlighted' : ''}`"
  />

  <!-- 加号按钮 - 只在hover时显示 -->
  <EdgeLabelRenderer>
    <div
      :class="`edge-plus-button duration-300 ${isHovered || isTriggerNodeVisible ? 'hovered' : ''}`"
      :style="{
        transform: `translate(-50%, -50%) translate(${path[1]}px, ${path[2]}px)`,
      }"
      @mouseover.stop="handleMouseOver"
      @mouseout.stop="handleMouseOut"
    >
      <a-trigger
        v-model:popup-visible="isTriggerNodeVisible"
        trigger="click"
        :click-outside-to-close="false"
        :unmount-on-close="false"
        :popup-translate="[6, 0]"
        position="right"
        @click.stop
      >
        <a-button
          type="text"
          :class="`w-[26px] h-[26px] rounded-full bg-blue-700 border-2 border-white shadow-md hover:transform hover:scale-130 duration-300`"
          @click="handleClick"
        >
          <template #icon>
            <icon-plus
              class="pointer-events-none text-white font-bold"
              size="12"
              :stroke-width="8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </template>
        </a-button>
        <template #content>
          <AddNode
            v-model:visible="isTriggerNodeVisible"
            :add-node-type="'edge'"
            :edge-id="props.id"
            :id="props.id"
          />
        </template>
      </a-trigger>
    </div>
  </EdgeLabelRenderer>
</template>

<style scoped>
.custom-edge-path {
  pointer-events: auto !important;
  z-index: 1;
}

.edge-plus-button {
  position: absolute;
  pointer-events: all;
  z-index: 100;
  display: none;
}

.hovered.edge-plus-button {
  display: block;
}
</style>
