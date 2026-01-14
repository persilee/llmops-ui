<script setup lang="ts">
import { Handle, Position, useVueFlow, type HandleType } from '@vue-flow/core'

import { computed, ref } from 'vue'
import { useWorkflowStore } from '../../Workflow.store'
import AddNode from '../AddNode.vue'

// 定义组件的props类型
const props = defineProps<{
  type: HandleType
  position: Position
  nodeId: string
}>()
const isTriggerNodeVisible = ref(false)
const store = useWorkflowStore()

// 从VueFlow中获取获取连接边的方法
const { getConnectedEdges, onEdgeClick, onNodeClick, onPaneClick } = useVueFlow()
// 计算属性：判断是否显示添加按钮
const isShowAdd = computed(() => {
  // 如果没有节点ID，不做处理
  if (!props.nodeId) return
  // 获取当前节点的所有连接边
  const connectedEdges = getConnectedEdges(props.nodeId)
  // 如果当前节点没有连接边，则显示添加按钮
  if (connectedEdges.length == 0) return true
  // 如果是 source 手柄, 则显示添加按钮
  return props.type == 'source'
})
onEdgeClick(() => {
  isTriggerNodeVisible.value = false
})

onNodeClick(() => {
  isTriggerNodeVisible.value = false
})

onPaneClick(() => {
  isTriggerNodeVisible.value = false
})
</script>

<template>
  <a-trigger
    v-model:popup-visible="isTriggerNodeVisible"
    trigger="click"
    :click-outside-to-close="false"
    :unmount-on-close="false"
    :popup-translate="position == Position.Right ? [6, 0] : [-6, 0]"
    :position="position"
    @click.stop
  >
    <handle
      :type="type"
      :position="position"
      :class="`w-3 h-3 bg-blue-700 flex border-2 border-white shadow-sm items-center justify-center group-hover:w-4 group-hover:h-4 group-hover:border-2 group-hover:shadow-md duration-360  ${isShowAdd ? 'hover:h-6.5 hover:w-6.5 handle hover:border-3 hover:shadow-lg pointer-events-auto' : 'pointer-events-none cursor-default'}`"
      @click.stop="store.showedAddNode = nodeId + type"
    >
      <icon-plus
        v-if="isShowAdd"
        class="pointer-events-none text-white font-bold duration-360"
        size="12"
        :stroke-width="8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </handle>
    <template #content>
      <AddNode
        v-model:visible="isTriggerNodeVisible"
        :add-node-type="'handle'"
        :node-id="nodeId"
        :id="nodeId + type"
      />
    </template>
  </a-trigger>
</template>

<style scoped>
.handle > svg {
  opacity: 0;
}
.handle:hover > svg {
  opacity: 1 !important;
}
</style>
