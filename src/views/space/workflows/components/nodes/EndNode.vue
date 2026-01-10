<script setup lang="ts">
import { Handle, type NodeProps, Position } from '@vue-flow/core'

// 1.定义自定义组件所需数据
const props = defineProps<NodeProps>()
</script>

<template>
  <div
    class="flex flex-col gap-1.5 rounded-xl py-3 px-4 bg-white shadow-xs hover:shadow-lg w-[360px] flow-node duration-160 group relative"
  >
    <div class="flow-node__bg w-full h-[160px] absolute top-0 left-0 rounded-xl z-0"></div>
    <!-- 节点标题信息 -->
    <div class="flex items-center gap-2 mb-1">
      <a-avatar shape="square" :size="24" class="bg-red-700 rounded-lg flex-shrink-0">
        <icon-filter :size="16" />
      </a-avatar>
      <div class="text-gray-700 font-semibold">{{ props.data?.title }}</div>
    </div>
    <!-- 输出变量列表 -->
    <div class="flex flex-col items-start py-2">
      <!-- 标题(分成左右两部分) -->
      <div class="w-full flex items-center mb-2 text-gray-700 text-xs">
        <!-- 左侧变量名 -->
        <div class="w-[180px] flex-shrink-0 flex items-center gap-2 text-gray-700">
          <div class="font-semibold">输出数据</div>
        </div>
        <!-- 右侧变量值 -->
        <div class="flex-1 font-semibold">值</div>
      </div>
      <!-- 输出变量列表 -->
      <div class="w-full flex flex-col gap-2">
        <div
          v-for="output in props.data?.outputs"
          :key="output.name"
          class="w-full flex items-center text-xs gap-2"
        >
          <!-- 左侧变量信息 -->
          <div class="w-[180px] flex-shrink-0 flex items-center gap-2">
            <div class="max-w-[120px] text-gray-700 line-clamp-1 break-all">{{ output.name }}</div>
            <div class="text-gray-500 bg-gray-100 px-1 py-0.5 rounded flex-shrink-0">
              {{ output.type }}
            </div>
          </div>
          <!-- 右侧变量引用 -->
          <div class="flex-1 flex">
            <div
              v-if="output.value.type == 'ref'"
              class="bg-white line-clamp-1 break-all text-gray-500 border border-gray-300 px-1 py-0.5 rounded"
            >
              引用 / {{ output.value.content.ref_var_name }}
            </div>
            <div v-else class="text-gray-500 flex-1 px-1 py-0.5 line-clamp-1 break-all">
              {{ output.value.content }}
            </div>
          </div>
        </div>
        <div v-if="!props.data?.outputs?.length" class="text-gray-500 text-xs mt-1">暂无数据</div>
      </div>
    </div>
    <!-- 结束节点-连接句柄 -->
    <handle
      type="target"
      :position="Position.Left"
      class="w-3 h-3 bg-blue-700 flex border-2 border-white shadow-sm items-center justify-center group-hover:w-4 group-hover:h-4 group-hover:border-2 group-hover:shadow-md duration-360 cursor-default"
    >
    </handle>
  </div>
</template>

<style scoped>
.flow-node {
  border: 1px solid #e5e7eb;
}

.flow-node__bg {
  background: linear-gradient(#c1000710 0%, transparent 80%);
}

.selected .flow-node {
  border: 1px solid #1447e6 !important;
}
</style>
