<script setup lang="ts">
import DotCursor from '@/components/DotCursor.vue'
import DotFlashing from '@/components/DotFlashing.vue'
import type {
  AgentThought as AgentThoughtType,
  GetDebugConversationMessagesWithPage,
} from '@/services/api/apps/types'
import { useAppStore } from '../../AppView.store'
import AgentThought from './AgentThought.vue'

const props = defineProps<{
  message: GetDebugConversationMessagesWithPage
  isShowDot: boolean
  agentThoughts: AgentThoughtType[]
  loading: boolean
  isShowCursor: boolean
  openingQuestions: string[]
}>()

const emits = defineEmits(['selectOpeningQuestion'])

const store = useAppStore()
</script>

<template>
  <div class="flex flex-row gap-2 mb-6">
    <!-- AI头像 -->
    <a-avatar class="shrink-0 bg-white" :size="34">
      <img :src="store.app?.icon" class="p-0.5" />
    </a-avatar>
    <div class="flex flex-col items-start gap-2">
      <!-- AI名称 -->
      <div class="font-semibold text-gray-700">
        {{ store.app?.name }}
      </div>
      <!-- 推理内容 -->
      <AgentThought :agent-thoughts="agentThoughts" :loading="loading" />
      <!-- AI消息 -->
      <div
        class="max-w-max bg-gray-100 text-gray-900 border border-gray-200 px-4 py-3 rounded-lg leading-5"
      >
        <DotFlashing v-if="isShowDot" />
        {{ message.answer }}
        <DotCursor v-if="isShowCursor" />
      </div>
      <div v-if="openingQuestions.length > 0" class="mt-3">
        <div
          v-for="(question, idx) in openingQuestions"
          :key="idx"
          class="border border-gray-200 rounded-lg py-1.5 px-3 cursor-pointer leading-5 hover:bg-gray-100 mb-1.5 w-fit"
          @click="emits('selectOpeningQuestion', question)"
        >
          {{ question }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
