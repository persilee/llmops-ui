<script setup lang="ts">
import { Handle, useVueFlow, type HandleType, type Position } from '@vue-flow/core'

import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AddNode from '../AddNode.vue'

// 定义组件的props类型
const props = defineProps<{
  type: HandleType
  position: Position
  nodeId?: string
}>()
const isTriggerNodeVisible = ref(false)

// 从VueFlow中获取获取连接边的方法
const { getConnectedEdges } = useVueFlow()
// 计算属性：判断是否显示添加按钮
const isShowAdd = computed(() => {
  // 如果没有节点ID，默认显示添加按钮
  if (!props.nodeId) return true
  // 获取当前节点的所有连接边
  const connectedEdges = getConnectedEdges(props.nodeId)
  // 检查是否存在连接到当前节点的边，如果不存在则显示添加按钮
  return !connectedEdges.some((edge) => edge.targetNode.id === props.nodeId)
})

const handleDocumentClick = () => {
  isTriggerNodeVisible.value = false
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <a-trigger
    v-model:popup-visible="isTriggerNodeVisible"
    trigger="click"
    show-arrow
    :unmount-on-close="false"
    :popup-translate="[6, 0]"
    position="right"
    @click.stop
  >
    <handle
      :type="type"
      :position="position"
      :class="`w-3 h-3 bg-blue-700 flex border-2 border-white shadow-sm items-center justify-center group-hover:w-4 group-hover:h-4 group-hover:border-2 group-hover:shadow-md duration-360  ${isShowAdd ? 'hover:h-6.5 hover:w-6.5 handle hover:border-3 hover:shadow-lg pointer-events-auto' : 'pointer-events-none cursor-default'}`"
      @click.stop
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
      <AddNode v-model:visible="isTriggerNodeVisible" :add-node-type="'handle'" :node-id="nodeId" />
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
