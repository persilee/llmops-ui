<script setup lang="ts">
import { Handle, type NodeProps, Position } from '@vue-flow/core'

// 1.定义自定义组件所需数据
const props = defineProps<NodeProps>()
</script>

<template>
  <div
      class="flex flex-col gap-3 rounded-xl p-3 bg-white shadow-xs hover:shadow-lg w-[360px] flow-node duration-160 group relative"
  >
    <div class="flow-node__bg w-full h-[80px] absolute top-0 left-0 rounded-xl z-0"></div>
    <!-- 节点标题信息 -->
    <div class="flex items-center gap-2">
      <a-avatar shape="square" :size="24" class="bg-green-700 rounded-lg flex-shrink-0">
        <icon-mind-mapping :size="16" />
      </a-avatar>
      <div class="text-gray-700 font-semibold">{{ props.data?.title }}</div>
    </div>
    <!-- 分类列表 -->
    <div
      v-for="(classifier, idx) in props.data?.classes"
      :key="idx"
      class="bg-gray-100 rounded-lg px-3 py-1.5 text-xs font-bold relative"
    >
      <p>分类{{ Number(idx) + 1 }}</p>
      <handle
        type="source"
        :id="classifier?.source_handle_id"
        :position="Position.Right"
        class="!w-4 !h-4 !bg-blue-700 !text-white flex items-center justify-center"
      >
        <icon-plus :size="12" class="pointer-events-none" />
      </handle>
    </div>
    <!-- 空数据展示 -->
    <div
      v-if="!props.data?.classes?.length"
      class="text-gray-700 bg-gray-100 rounded-lg p-3 text-xs"
    >
      该节点暂未添加问题分类信息
    </div>
    <!-- 意图识别节点-连接句柄 -->
    <handle
      type="target"
      :position="Position.Left"
      class="w-3 h-3 bg-blue-700 flex border-2 border-white shadow-sm items-center justify-center group-hover:w-4 group-hover:h-4 group-hover:border-2 group-hover:shadow-md duration-360 hover:h-6.5 hover:w-6.5 handle hover:border-3 hover:shadow-lg"
    >
      <icon-plus
        class="pointer-events-none text-white font-bold duration-360"
        size="12"
        :stroke-width="8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </handle>
  </div>
</template>

<style scoped>
.flow-node {
  border: 1px solid #e5e7eb;
}

.flow-node__bg {
  background: linear-gradient(#00823510 0%, transparent 80%);
}
.handle > svg {
  opacity: 0;
}
.handle:hover > svg {
  opacity: 1 !important;
}

.selected .flow-node {
  border: 1px solid #1447e6 !important;
}
</style>
