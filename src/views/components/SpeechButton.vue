<script setup lang="ts">
import IconAudioWave from '@/components/icons/IconAudioWave.vue'
import AudioApi from '@/services/api/audio'
import { Message } from '@arco-design/web-vue'
import { onUnmounted, ref } from 'vue'
const isShowIconAudioWave = ref(false)
const audioElement = ref<HTMLAudioElement>()
const isAudioLoaded = ref(false)
const isPlaying = ref(false)

const props = defineProps<{
  messageId?: string
  text?: string
  voice?: number
  size?: string
}>()
const DEFAULT_VOICE_ID = 4194

const fetchAudioStream = async (): Promise<string | undefined> => {
  try {
    const resp = props.messageId
      ? await AudioApi.messageToAudio(props.messageId)
      : await AudioApi.textToAudio(props.text!, props.voice ?? DEFAULT_VOICE_ID)

    const arrayBuffer = await resp.arrayBuffer()
    const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' })
    return URL.createObjectURL(audioBlob)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    Message.error(`音频流获取失败: ${errorMessage}`)
    return undefined
  }
}

/**
 * 处理文本转语音功能
 * @param messageId 消息ID，用于获取对应的音频流
 */
const handelTextToSpeech = async () => {
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
    const audioUrl = await fetchAudioStream()

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
  <a-button
    v-if="!isShowIconAudioWave"
    type="text"
    :style="{ width: `${size}px`, height: `${size}px` }"
    @click="handelTextToSpeech()"
  >
    <template #icon>
      <slot>
        <icon-sound class="text-gray-500 w-3.5 h-3.5" />
      </slot>
    </template>
  </a-button>
  <div
    v-else
    :style="{ width: `${size}px`, height: `${size}px` }"
    class="hover:bg-gray-200 flex items-center justify-center rounded-lg p-1 cursor-pointer"
    @click="handelPauseToggle()"
  >
    <IconAudioWave :is-playing="isPlaying" />
  </div>
</template>

<style scoped></style>
