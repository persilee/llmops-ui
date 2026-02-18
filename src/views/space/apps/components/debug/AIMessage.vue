<script setup lang="ts">
import DotCursor from '@/components/DotCursor.vue'
import DotFlashing from '@/components/DotFlashing.vue'
import type {
  AgentThought as AgentThoughtType,
  GetDebugConversationMessagesWithPage,
} from '@/services/api/apps/types'
import MarkdownRender from '@/views/components/MarkdownRender.vue'
import SpeechButton from '@/views/components/SpeechButton.vue'
import { Message } from '@arco-design/web-vue'
import { useAppStore } from '../../AppView.store'
import AgentThought from './AgentThought.vue'

const props = defineProps<{
  message: GetDebugConversationMessagesWithPage
  isShowDot: boolean
  agentThoughts: AgentThoughtType[]
  loading: boolean
  isShowCursor: boolean
  openingQuestions: string[]
  icon?: string
  name?: string
  latency?: number
  totalTokenCount?: number
  isLastItem?: boolean
  isShareMessages?: boolean
  isTextToSpeech?: boolean
}>()

const emits = defineEmits(['selectOpeningQuestion', 'regenerate', 'deleteMessage', 'shareMessages'])

const store = useAppStore()

const markdownOptions = {
  html: true,
  linkify: true,
  typographer: true,
  highlight: true,
}

const copyToClipboard = async (text: string) => {
  try {
    // 使用Clipboard API将文本复制到剪贴板
    await navigator.clipboard.writeText(text)

    // 复制成功时显示成功提示消息
    Message.success('复制成功')
  } catch (err) {
    // 复制失败时捕获错误并显示失败提示消息
    Message.error('复制失败' + err)
  }
}
</script>

<template>
  <div class="flex flex-row gap-2 mb-6 w-full">
    <!-- AI头像 -->
    <a-avatar class="shrink-0" :size="34" style="background-color: transparent">
      <img :src="icon ?? store.app?.icon" class="p-0.5" />
    </a-avatar>
    <div class="flex-1 flex flex-col items-start gap-2 min-w-0 pr-[42px]">
      <!-- AI名称 -->
      <div class="font-semibold text-gray-700">
        {{ name ?? store.app?.name }}
      </div>
      <!-- 推理内容 -->
      <AgentThought :agent-thoughts="agentThoughts" :loading="loading" />
      <!-- AI消息 -->
      <div class="flex flex-col group gap-1.5 min-w-0">
        <div
          class="max-w-max bg-gray-100 text-gray-900 border border-gray-200 px-4 py-3 rounded-lg leading-5"
        >
          <DotFlashing v-if="isShowDot" />
          <MarkdownRender :source="message.answer" :options="markdownOptions" />
          <DotCursor v-if="isShowCursor" />
        </div>
        <div
          v-if="!isShowCursor && !isShowDot && !isShareMessages"
          class="flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1 text-gray-500 text-xs">
              {{ latency?.toFixed(2) }}s
            </div>
            <div class="bg-gray-400 w-[1px] h-[9px]"></div>
            <div class="text-gray-500 text-xs">{{ totalTokenCount }} Tokens</div>
          </div>
          <div
            :class="`flex items-center ${isLastItem ? '' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`"
          >
            <a-tooltip content="复制">
              <a-button
                type="text"
                size="mini"
                class="hover:bg-gray-200"
                @click="copyToClipboard(message.answer)"
              >
                <template #icon><icon-copy class="text-gray-500 w-3.5 h-3.5" /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip content="重新生成">
              <a-button
                type="text"
                size="mini"
                class="hover:bg-gray-200"
                @click="emits('regenerate', message)"
              >
                <template #icon><icon-refresh class="text-gray-500 w-3.5 h-3.5" /></template>
              </a-button>
            </a-tooltip>
            <SpeechButton
              v-if="isTextToSpeech"
              :text="message.answer.length <= 600 ? message.answer : ''"
              :message-id="message.answer.length > 600 ? message.id : ''"
              :voice="store.draftAppConfig.text_to_speech.voice"
              size="24"
              class="hover:bg-gray-200 rounded-lg"
            />
            <a-tooltip content="分享">
              <a-button
                type="text"
                size="mini"
                class="hover:bg-gray-200"
                @click="emits('shareMessages', message)"
              >
                <template #icon><icon-share-alt class="text-gray-500 w-3.5 h-3.5" /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip content="删除">
              <a-button
                type="text"
                size="mini"
                class="hover:bg-gray-200"
                @click="emits('deleteMessage', message)"
              >
                <template #icon><icon-delete class="text-red-500 w-3.5 h-3.5" /></template>
              </a-button>
            </a-tooltip>
          </div>
        </div>
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
