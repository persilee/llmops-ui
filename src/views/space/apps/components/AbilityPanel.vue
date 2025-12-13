<script setup lang="ts">
import LongTermMemory from './ability/LongTermMemory.vue'
import OpeningStatement from './ability/OpeningStatement.vue'
</script>

<template>
  <div class="flex-1 flex flex-col">
    <div class="flex items-center h-10 px-6 font-bold text-gray-900">应用能力</div>

    <div class="flex-1 overflow-y-scroll">
      <a-collapse :default-active-key="['1', '2']" :bordered="false">
        <!-- 长期记忆 -->
        <LongTermMemory />
        <!-- 对话开场白 -->
        <OpeningStatement />
      </a-collapse>
    </div>
  </div>
</template>

<style scoped>
:deep(.arco-collapse-item-header, .arco-collapse-item-active > .arco-collapse-item-header) {
  background-color: transparent !important;
}

:deep(.arco-collapse-item-active > .arco-collapse-item-header) {
  border-color: transparent !important;
}
</style>
