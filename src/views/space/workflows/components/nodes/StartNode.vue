<script setup lang="ts">
import { Handle, Position, type NodeProps } from '@vue-flow/core'

const props = defineProps<NodeProps>()
</script>

<template>
  <div class="">
    <div
    class="flex flex-col gap-3 rounded-xl p-3 bg-white shadow-xs hover:shadow-lg w-[360px] flow-node duration-160 group relative"
    >
      <div class="flow-node__bg w-full h-[80px] absolute top-0 left-0 rounded-xl z-0"></div>
      <!-- 节点标题信息 -->
      <div class="flex items-center gap-2 z-10">
        <a-avatar shape="square" :size="24" class="bg-blue-700 rounded-lg">
          <icon-home />
        </a-avatar>
        <div class="text-gray-700 font-semibold">{{ props.data?.title }}</div>
      </div>
      <!-- 输入变量列表 -->
      <div class="flex flex-col items-start bg-gray-100 rounded-lg p-3">
        <!-- 标题(分成左右两部分) -->
        <div class="w-full flex items-center gap-2 mb-2 text-gray-700 text-xs">
          <!-- 左侧变量名 -->
          <div class="w-[180px] flex-shrink-0 flex items-center gap-2 text-gray-700">
            <icon-caret-down />
            <div class="font-semibold">输入数据</div>
          </div>
          <!-- 右侧变量值 -->
          <div class="flex-1 font-semibold">值</div>
        </div>
        <!-- 输入变量 -->
        <div class="w-full flex flex-col gap-2">
          <div
            v-for="input in props.data.inputs"
            :key="input.name"
            class="w-full flex items-center text-xs gap-2"
          >
            <!-- 左侧变量信息 -->
            <div class="w-[180px] flex-shrink-0 flex items-center gap-2">
              <div class="flex items-center gap-1">
                <div class="text-gray-700 line-clamp-1 break-all">{{ input.name }}</div>
                <div v-if="input.required" class="text-red-700 flex-shrink-0">*</div>
              </div>
              <div
                class="max-w-[60px] line-clamp-1 break-all text-gray-500 bg-gray-200 px-1 py-0.5 rounded flex-shrink-0"
              >
                {{ input.type }}
              </div>
            </div>
            <!-- 右侧变量引用 -->
            <div class="flex-1 flex">
              <div
                v-if="input.value.type == 'ref'"
                class="bg-white line-clamp-1 break-all text-gray-500 border px-1 py-0.5 rounded"
              >
                引用 / {{ input.value.content.ref_var_name }}
              </div>
              <div v-else class="text-gray-500 inline-block px-1 py-0.5">
                {{ input.value.content }}
              </div>
            </div>
          </div>
          <div v-if="!props.data?.inputs?.length" class="text-gray-500 text-xs px-0.5">-</div>
        </div>
      </div>
      <!-- 输出变量列表 -->
      <div class="flex flex-col items-start bg-gray-100 rounded-lg p-3">
        <!-- 标题 -->
        <div class="flex items-center gap-2 mb-2 text-gray-700">
          <icon-caret-down />
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
            <div class="text-gray-500 bg-gray-200 px-1 py-0.5 rounded">{{ output.type }}</div>
          </div>
        </div>
      </div>
      <!-- 工具节点-连接句柄 -->
      <Handle
        type="source"
        :position="Position.Right"
        class="w-3 h-3 bg-blue-700 flex border-2 border-white shadow-sm items-center justify-center group-hover:w-4 group-hover:h-4 group-hover:border-2 group-hover:shadow-md duration-360 hover:h-6.5 hover:w-6.5 handle hover:border-3 hover:shadow-lg"
      >
        <icon-plus
          class="pointer-events-none text-white font-bold duration-360"
          size="12"
          :stroke-width="8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </Handle>
    </div>
  </div>
</template>

<style scoped>
.flow-node {
  border: 1px solid #e5e7eb;
}

.flow-node__bg {
  background: linear-gradient(#1449e610 0%, transparent 80%);
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
