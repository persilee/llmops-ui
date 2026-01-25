<script setup lang="ts">
// 1.定义自定义组件所需数据
const props = defineProps({
  title: { type: String, default: '' },
  help: { type: String, default: '' },
  data: { type: Number, default: 0 },
  unit: { type: String, default: '次' },
  pop: { type: Number, default: 0 },
})
</script>

<template>
  <div class="flex flex-col flex-1 gap-3 bg-white border border-gray-200 rounded-lg px-6 py-5">
    <!-- 指标卡标题 -->
    <div class="flex items-center text-gray-700">
      <div
        class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 border border-blue-200"
      >
        <!-- 创建命名插槽 -->
        <slot name="icon"></slot>
      </div>
      <div class="text-gray-700 font-semibold mr-1 ml-2">{{ props.title }}</div>
      <a-popover placement="top" :content="props.help" class="w-[220px]">
        <icon-info-circle />
      </a-popover>
    </div>
    <!-- 指标卡数据 -->
    <div class="flex items-baseline gap-4">
      <!-- 数据 -->
      <div class="flex items-baseline gap-1 text-gray-700 font-semibold">
        <div class="text-2xl">
          {{ props.data % 1 !== 0 ? props.data.toFixed(2) : props.data.toString() }}
        </div>
        <div class="">{{ props.unit }}</div>
      </div>
      <!-- 环比 -->
      <div class="flex items-center gap-1 text-gray-500 text-xs">
        <div class="">环比</div>
        <div class="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-blue-100">
          <img src="@/assets/images/icon-month-on-month.svg" class="w-1.5 h-1.5" />
        </div>
        <div class="text-blue-700">{{ (props.pop * 100).toFixed(2) }}%</div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
