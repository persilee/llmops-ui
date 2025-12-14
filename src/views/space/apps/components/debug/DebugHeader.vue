<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../../AppView.store'
import SummaryModel from './SummaryModel.vue'

const visible = ref(false)
const store = useAppStore()

const handleSummary = () => {
  visible.value = true
}
</script>

<template>
  <div
    class="flex items-center justify-between flex-shrink-0 h-16 px-4 bg-white border-b border-gray-200"
  >
    <div class="text-xl text-gray-900">调试与预览</div>
    <a-button
      v-if="store.draftAppConfig.long_term_memory.enable"
      type="text"
      class="font-medium text-blue-700"
      @click="handleSummary"
    >
      <template #icon>
        <img src="@/assets/images/icon-summary.svg" class="w-4 h-4" />
      </template>
      长期记忆
    </a-button>
    <SummaryModel v-model:visible="visible" />
  </div>
</template>

<style scoped></style>
