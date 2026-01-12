<script setup lang="ts">
import { type NodeProps, Position } from '@vue-flow/core'
import NodeHandle from './NodeHandle.vue'

// 1.定义自定义组件所需数据
const props = defineProps<NodeProps>()
</script>

<template>
  <div
    class="flex flex-col gap-1.5 rounded-xl py-3 px-4 bg-white shadow-xs hover:shadow-lg w-[360px] flow-node duration-160 group relative"
  >
    <div class="flow-node__bg w-full h-[160px] absolute top-0 left-0 rounded-xl z-0"></div>
    <!-- 顶部节点标题 -->
    <div class="flex items-center gap-2 mb-1">
      <a-avatar shape="square" :size="24" class="bg-sky-500 rounded-lg flex-shrink-0">
        <icon-language :size="16" />
      </a-avatar>
      <div class="text-gray-700 font-semibold">{{ props.data?.title }}</div>
    </div>
    <!-- 输入变量列表 -->
    <div class="flex flex-col items-start py-2">
      <!-- 标题(分成左右两部分) -->
      <div class="w-full flex items-center gap-2 mb-2 text-gray-700 text-xs">
        <!-- 左侧变量名 -->
        <div class="w-[180px] flex-shrink-0 flex items-center gap-2 text-gray-700">
          <div class="font-semibold">输入数据</div>
        </div>
        <!-- 右侧值信息 -->
        <div class="flex-1">值</div>
      </div>
      <!-- 输入变量列表 -->
      <div class="w-full flex flex-col gap-2">
        <div
          v-for="input in props.data?.inputs"
          :key="input.name"
          class="w-full flex items-center text-xs gap-2"
        >
          <!-- 左侧变量信息 -->
          <div class="w-[180px] flex-shrink-0 flex items-center gap-2">
            <div class="flex items-center gap-1">
              <div class="text-gray-700 line-clamp-1 break-all">{{ input.name }}</div>
              <div v-if="input.required" class="text-red-700 flex-shrink-0">*</div>
            </div>
            <div class="text-gray-500 bg-gray-100 px-1 py-0.5 rounded flex-shrink-0">
              {{ input.type }}
            </div>
          </div>
          <!-- 右侧变量引用 -->
          <div class="flex-1 flex">
            <div
              v-if="input.value.type == 'ref'"
              class="bg-white line-clamp-1 break-all text-gray-500 border border-gray-300 px-1 py-0.5 rounded"
            >
              引用 / {{ input.value.content.ref_var_name }}
            </div>
            <div v-else class="text-gray-500 flex-1 px-1 py-0.5 line-clamp-1 break-all">
              {{ input.value.content }}
            </div>
          </div>
        </div>
        <div v-if="!props.data?.inputs?.length" class="text-gray-500 text-xs px-0.5">-</div>
      </div>
    </div>
    <!-- 提示词 -->
    <div class="flex flex-col items-start py-2">
      <!-- 标题 -->
      <div class="flex items-center gap-2 mb-2 text-gray-700">
        <div class="text-xs font-semibold">提示词</div>
      </div>
      <!-- 内容 -->
      <div class="text-xs text-gray-700 leading-5 line-clamp-3">
        {{ props.data?.prompt ?? '暂无数据' }}
      </div>
    </div>
    <!-- 输出变量列表 -->
    <div class="flex flex-col items-start py-2">
      <!-- 标题 -->
      <div class="flex items-center gap-2 mb-2 text-gray-700">
        <div class="text-xs font-semibold">输出数据</div>
      </div>
      <!-- 变量列表 -->
      <div class="flex flex-col gap-2">
        <div
          v-for="output in props.data?.outputs"
          :key="output.name"
          class="flex items-center gap-2 text-xs"
        >
          <div class="max-w-[180px] text-gray-700 line-clamp-1 break-all">{{ output.name }}</div>
          <div class="text-gray-500 bg-gray-100 px-1 py-0.5 rounded">{{ output.type }}</div>
        </div>
      </div>
    </div>
    <!-- 边起点句柄位置在右侧 -->
    <NodeHandle type="source" :position="Position.Right" :node-id="props.id" />
    <NodeHandle type="target" :position="Position.Left" :node-id="props.id" />
  </div>
</template>

<style scoped>
.flow-node {
  border: 1px solid #e5e7eb;
}

.flow-node__bg {
  background: linear-gradient(#00a6f416 0%, transparent 80%);
}

.selected .flow-node {
  border: 1px solid #1447e6 !important;
}
</style>
