<script setup lang="ts">
import { type NodeProps, Position } from '@vue-flow/core'
import { isEmpty } from 'lodash-es'
import { onUnmounted, ref, watch } from 'vue'
import { useWorkflowStore } from '../../Workflow.store'
import NodeHandle from './NodeHandle.vue'
import NodeRunInfo from './NodeRunInfo.vue'
import NodeTitleInfo from './NodeTitleInfo.vue'

// 1.定义自定义组件所需数据
const props = defineProps<NodeProps>()
const store = useWorkflowStore()
const nodeResult = ref<any>()

const stop = watch(
  () => store.questionClassifierNodeResult,
  (newData) => {
    nodeResult.value = newData
  },
)

onUnmounted(() => {
  stop()
})
</script>

<template>
  <div>
    <div
      class="flex flex-col gap-1.5 rounded-xl py-3 px-4 bg-white shadow-xs hover:shadow-lg w-[360px] flow-node duration-160 group relative"
    >
      <div class="flow-node__bg w-full h-[160px] absolute top-0 left-0 rounded-xl z-0"></div>
      <!-- 节点标题信息 -->
      <NodeTitleInfo v-model:node-result="nodeResult" :node="props">
        <a-avatar shape="square" :size="24" class="bg-green-700 rounded-lg flex-shrink-0">
          <icon-mind-mapping :size="16" />
        </a-avatar>
      </NodeTitleInfo>
      <!-- 分类列表 -->
      <div
        v-for="(classifier, idx) in props.data?.classes"
        :key="idx"
        class="bg-gray-100 rounded-lg px-3 py-1.5 text-xs font-bold relative"
      >
        <p>分类{{ Number(idx) + 1 }}</p>
        <NodeHandle type="source" :position="Position.Right" :node-id="props.id" />
      </div>
      <!-- 空数据展示 -->
      <div
        v-if="!props.data?.classes?.length"
        class="text-gray-700 bg-gray-100 rounded-lg p-3 text-xs"
      >
        该节点暂未添加问题分类信息
      </div>
      <!-- 意图识别节点-连接句柄 -->
      <NodeHandle type="target" :position="Position.Left" :node-id="props.id" />
    </div>
    <NodeRunInfo v-if="!isEmpty(nodeResult)" :data="nodeResult" :loading="store.nodeDebugLoading" />
  </div>
</template>

<style scoped>
.flow-node {
  border: 1px solid #e5e7eb;
}

.flow-node__bg {
  background: linear-gradient(#00823510 0%, transparent 80%);
}

.selected .flow-node {
  border: 1px solid #1447e6 !important;
}

:deep(.arco-collapse-item-content) {
  background-color: white !important;
}
:deep(.arco-collapse-item-header) {
  border-bottom: none !important;
}
</style>
