<script setup lang="ts">
import DotCursor from '@/components/DotCursor.vue'
import DotFlashing from '@/components/DotFlashing.vue'
import type {
  AgentThought as AgentThoughtType,
  GetDebugConversationMessagesWithPage,
} from '@/services/api/apps/types'
import AudioApi from '@/services/api/audio'
import MarkdownRender from '@/views/components/MarkdownRender.vue'
import SpeechButton from '@/views/components/SpeechButton.vue'
import { Message } from '@arco-design/web-vue'
import { computed, onUnmounted, ref } from 'vue'
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
const isShowIconAudioWave = ref(false)
const audioElement = ref<HTMLAudioElement>()
const isAudioLoaded = ref(false)
const isPlaying = ref(false)

const getTooltipContent = computed(() => {
  if (!isShowIconAudioWave.value) return '语音朗读'
  if (isPlaying.value) return '暂停朗读'
  if (isAudioLoaded.value) return '继续朗读'
  return '语音朗读'
})

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

const fetchAudioStream = async (messageId: string) => {
  try {
    const resp = await AudioApi.messageToAudio(messageId)
    const arrayBuffer = await resp.arrayBuffer()
    const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' })
    const audioUrl = URL.createObjectURL(audioBlob)

    return audioUrl
  } catch (error) {
    Message.error(`音频流获取失败: ${error}`)
  }
}

/**
 * 处理文本转语音功能
 * @param messageId 消息ID，用于获取对应的音频流
 */
const handelTextToSpeech = async (messageId: string) => {
  // 显示音频波形图标
  isShowIconAudioWave.value = true

  // 如果音频已加载且正在播放，则重新开始播放
  if (isAudioLoaded.value && audioElement.value) {
    if (audioElement.value.paused) {
      // 暂停状态：继续播放
      await resumePlay()
    } else {
      // 播放状态：重置到开头重新播放
      await restartPlay()
    }
    return
  } else {
    // 新播放，检查浏览器自动播放策略
    try {
      // 先尝试获取音频上下文权限（部分浏览器需要）
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      await audioContext.resume()
      audioContext.close()
    } catch (e) {
      console.warn('获取音频权限失败:', e)
    }
  }

  // 重置所有音频相关状态
  isAudioLoaded.value = false
  isPlaying.value = false

  try {
    const audioUrl = await fetchAudioStream(messageId)

    // 初始化音频元素
    audioElement.value = new Audio(audioUrl)
    audioElement.value.preload = 'auto'

    // 设置音频事件监听器
    audioElement.value.onplay = () => {
      isPlaying.value = true
      isShowIconAudioWave.value = true
    }

    audioElement.value.onpause = () => {
      isPlaying.value = false
      // 暂停时不隐藏图标，只有播放结束/手动停止时才隐藏
    }

    // 播放结束事件处理
    audioElement.value.onended = () => {
      isShowIconAudioWave.value = false
      isPlaying.value = false
      isAudioLoaded.value = false
      // 释放临时URL，避免内存泄漏
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }

    // 音频播放错误处理
    audioElement.value.onerror = (e) => {
      Message.error('音频播放出错，请重试')
      onAudioPause()
    }

    // 当音频可以播放时再开始播放（解决音频未加载完成就播放的问题）
    audioElement.value.oncanplay = async () => {
      try {
        if (isShowIconAudioWave.value) {
          await audioElement.value?.play()
          isPlaying.value = true
          isAudioLoaded.value = true
        }
      } catch (error) {
        console.error('播放音频失败:', error)
        Message.error('播放音频失败，请重试')
        onAudioPause()
      }
    }

    // 兜底：监听播放进度，当接近末尾时手动触发ended事件（防止某些浏览器不触发原生事件）
    audioElement.value.ontimeupdate = () => {
      if (audioElement.value && audioElement.value.duration > 0) {
        // 当播放到距离末尾0.6秒以内时，手动触发结束事件
        if (audioElement.value.currentTime >= audioElement.value.duration - 0.6) {
          audioElement.value.dispatchEvent(new Event('ended'))
        }
      }
    }
  } catch (error) {
    // 处理播放失败的情况
    console.error('播放音频失败:', error)
    Message.error('播放音频失败，请重试')
    onAudioPause()
  }
}

/**
 * 暂停/继续播放切换（点击音频控制图标时调用）
 */
const handelPauseToggle = async () => {
  if (!audioElement.value) return

  if (audioElement.value.paused) {
    // 暂停状态：继续播放
    await resumePlay()
  } else {
    // 播放状态：暂停
    audioElement.value.pause()
    isPlaying.value = false
    // 隐藏图标
    isShowIconAudioWave.value = false
  }
}

/**
 * 停止播放（重置进度并隐藏图标）
 */
const handelStopPlay = () => {
  isShowIconAudioWave.value = false
  isPlaying.value = false

  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value.currentTime = 0
    // 释放音频URL资源
    if (audioElement.value.src) {
      URL.revokeObjectURL(audioElement.value.src)
    }
    audioElement.value.src = ''
  }
}

/**
 * 继续播放（从当前进度开始）
 */
const resumePlay = async () => {
  if (!audioElement.value) return

  try {
    await audioElement.value.play()
    isPlaying.value = true
    isShowIconAudioWave.value = true
  } catch (error) {
    console.error('继续播放失败:', error)
    Message.error('继续播放失败，请重试')
  }
}

/**
 * 重新播放（从开头开始）
 */
const restartPlay = async () => {
  if (!audioElement.value) return

  try {
    audioElement.value.currentTime = 0
    await audioElement.value.play()
    isPlaying.value = true
  } catch (error) {
    console.error('重新播放失败:', error)
    Message.error('重新播放失败，请重试')
  }
}

// 定义音频停止播放监听函数
const onAudioPause = () => {
  isPlaying.value = false
  isShowIconAudioWave.value = false
}

onUnmounted(() => {
  // 清理音频资源
  if (audioElement.value) {
    // 移除所有事件监听
    audioElement.value.onplay = null
    audioElement.value.onpause = null
    audioElement.value.onended = null
    audioElement.value.onerror = null

    // 停止并释放音频
    audioElement.value.pause()
    if (audioElement.value.src) {
      URL.revokeObjectURL(audioElement.value.src)
    }
    audioElement.value.src = ''
    audioElement.value = undefined
  }

  // 重置状态
  isAudioLoaded.value = false
  isPlaying.value = false
  isShowIconAudioWave.value = false
})
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
            <a-tooltip v-if="isTextToSpeech" :content="getTooltipContent">
              <SpeechButton
                :message-id="message.id"
                size="24"
                class="hover:bg-gray-200 rounded-lg"
              />
            </a-tooltip>
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
