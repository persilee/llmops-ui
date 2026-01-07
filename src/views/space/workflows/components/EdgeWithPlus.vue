<script setup lang="ts">
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useVueFlow,
  type EdgeProps,
} from '@vue-flow/core'
import { computed } from 'vue'

// 定义组件属性
const props = defineProps<EdgeProps>()

const isHovered = defineModel('isHovered', { type: Boolean, default: false })

// 获取vue-flow实例
const { addNodes, addEdges } = useVueFlow()

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

// 加号按钮点击事件
const handlePlusClick = () => {
  console.log('Plus button clicked on edge:', props.id)
}

const handleMouseOver = () => {
  isHovered.value = true
}
const handleMouseOut = () => {
  isHovered.value = false
}
</script>

<template>
  <!-- 使用BaseEdge渲染基础的edge路径 -->
  <BaseEdge
    :id="id"
    :style="style"
    :path="path[0]"
    :marker-end="markerEnd"
    :class="`custom-edge-path ${isHovered ? 'hovered' : ''}`"
  />

  <!-- 加号按钮 - 只在hover时显示 -->
  <EdgeLabelRenderer>
    <div
      :class="`edge-plus-button duration-300 ${isHovered ? 'hovered' : ''}`"
      :style="{
        transform: `translate(-50%, -50%) translate(${path[1]}px, ${path[2]}px)`,
      }"
      @mouseover.stop="handleMouseOver"
      @mouseout.stop="handleMouseOut"
    >
      <a-button
        type="text"
        :class="`w-[26px] h-[26px] rounded-full bg-blue-700 border-2 border-white shadow-md hover:transform hover:scale-130 duration-300`"
        @click.stop="handlePlusClick"
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
