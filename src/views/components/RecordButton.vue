<script setup lang="ts">
import AudioApi from '@/services/api/audio'
import { Message } from '@arco-design/web-vue'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{
  type: 'button' | 'waveform'
}>()
const visible = defineModel('visible', { type: Boolean, default: false })
const emits = defineEmits(['success'])
// 录音状态
const isRecording = ref(false)
// 波纹数据，初始36个波纹条，高度8px
const waveformData = ref(Array(36).fill(8))
// 录音后音频的blob数据
const recordedAudio = ref<any>(null)
// 录制的音频URL
const recordedAudioUrl = ref('')

// 音频相关变量
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let mediaStream: MediaStream | null = null
let mediaRecorder: MediaRecorder | null = null
let mediaStreamSource: MediaStreamAudioSourceNode | null = null
let animationId: number | null = null
const audioChunks = ref<Blob[]>([])
const loading = ref(false)

/**
 * 获取浏览器支持的音频MIME类型
 */
const getSupportedMimeType = () => {
  const supportedTypes = [
    'audio/mp4; codecs=mp4a.40.2', // MP4格式
    'audio/webm; codecs=opus', // WebM格式
    'audio/webm',
    'audio/wav', // WAV格式
  ]
  for (const type of supportedTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return null
}

const handleRecording = async () => {
  if (isRecording.value) {
    await stopRecording()
  }
}

// 开始录音
const startRecording = async () => {
  try {
    loading.value = true
    // 请求麦克风权限
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true },
    })

    // 初始化音频上下文
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    analyser = audioContext.createAnalyser()
    // 设置FFT大小，控制波纹精度
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.8 // 波纹平滑度

    // 连接音频节点
    mediaStreamSource = audioContext.createMediaStreamSource(mediaStream)
    mediaStreamSource.connect(analyser)

    // 初始化MediaRecorder，用于录制音频
    const mimeType = getSupportedMimeType()
    if (!mimeType) {
      Message.warning('您的浏览器不支持音频录制')
      return
    }
    mediaRecorder = new MediaRecorder(mediaStream, { mimeType })

    // 监听录制数据
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.value.push(event.data)
      }
    }

    // 6. 监听录制结束
    mediaRecorder.onstop = async () => {
      // 检查是否有录制到数据
      if (audioChunks.value.length === 0) {
        Message.warning('未录制到音频数据，请检查麦克风是否正常工作')
        return
      }
      try {
        loading.value = true
        // 创建完整的音频blob
        const audioBlob = new Blob(audioChunks.value, { type: mimeType })
        recordedAudio.value = audioBlob

        const reader = new FileReader()
        reader.onload = () => {
          recordedAudioUrl.value = reader.result as string
        }
        reader.readAsDataURL(audioBlob)

        // 清空临时数据
        audioChunks.value = []

        const resp = await AudioApi.audioToText(
          audioBlob,
          getFileExtension(recordedAudio.value.type),
        )
        emits('success', resp.data.text)
      } catch (error) {
        emits('success', '')
        Message.warning('未识别到文字')
      } finally {
        loading.value = false
      }
    }

    // 隐藏加载动画
    loading.value = false
    // 开始录制和波纹更新
    mediaRecorder.start()
    // 开始更新波纹
    isRecording.value = true
    updateWaveform()
  } catch (error) {
    Message.warning('请允许麦克风权限以使用录音功能')
  }
}

// 停止录音
const stopRecording = async () => {
  isRecording.value = false

  // 清理动画
  if (animationId) cancelAnimationFrame(animationId)
  // 停止MediaRecorder录制
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  // 清理音频资源
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
  }
  // 清理音频资源
  if (mediaStreamSource) mediaStreamSource.disconnect()
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close()
  }

  // 重置波纹
  waveformData.value = Array(36).fill(8)
}

/**
 * 从MIME类型获取文件扩展名
 */
const getFileExtension = (mimeType: string) => {
  // 移除可能的编解码器参数
  const baseType = mimeType.split(';')[0].trim()
  // 提取扩展名
  const extension = baseType.split('/')[1]
  return extension
}

const downloadAudio = () => {
  if (!recordedAudio.value) return
  const reader = new FileReader()
  reader.onload = () => {
    const a = document.createElement('a')
    a.href = reader.result as string
    const extension = getFileExtension(recordedAudio.value.type)
    a.download = `recorded-audio-${new Date().getTime()}.${extension}`
    a.click()
  }
  reader.readAsDataURL(recordedAudio.value)
}

// 更新波纹数据
const updateWaveform = () => {
  if (!isRecording.value || !analyser) return

  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  analyser.getByteFrequencyData(dataArray)

  // 取前36个数据点，映射为波纹高度(8-30px)
  waveformData.value = Array.from(dataArray.slice(0, 36)).map((value: number) => {
    return Math.max(8, (value / 255) * 30)
  })

  animationId = requestAnimationFrame(updateWaveform)
}

// 获取波纹条颜色（从浅紫到深紫渐变）
const getBarColor = (index: number) => {
  const totalBars = waveformData.value.length
  // 紫色色相范围，根据索引调整亮度
  const hue = 206 + (index / totalBars) * 30
  const saturation = 100
  const lightness = 78 - (index / totalBars) * 30

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

onMounted(() => {
  nextTick(() => {
    startRecording()
  })
})

// 组件卸载时清理资源
onUnmounted(() => {
  stopRecording()
  try {
    URL.revokeObjectURL(recordedAudioUrl.value)
  } catch (e) {
    // 忽略FileReader生成的URL的释放错误
  }
})
</script>

<template>
  <div
    v-if="visible"
    :class="`flex flex-1 items-center justify-center min-h-[48px] rounded-full cursor-pointer ${type == 'button' ? 'recorder-btn' : ''}`"
    @click="handleRecording"
  >
    <a-spin :loading="loading">
      <Transition>
        <div v-if="!loading" class="waveform relative">
          <div
            class="w-[60px] h-[40px] absolute left-[-16px] linear-gradient-transparency-left"
          ></div>
          <div
            class="w-[60px] h-[40px] absolute right-[-16px] linear-gradient-transparency-right"
          ></div>
          <span
            v-for="(height, index) in waveformData"
            :key="index"
            class="waveform-bar"
            :style="{
              height: `${height}px`,
              background: getBarColor(index),
            }"
          ></span>
        </div>
      </Transition>
    </a-spin>
  </div>
</template>

<style scoped>
.recorder-btn {
  position: relative;
  z-index: 0;
  border-radius: 24px;
  border-color: #d1d5dc !important;
  box-shadow: 0 0 20px 0 #d1d5dc80 !important;
  transition: all 0.3s ease-in-out;
}

.recorder-btn:before {
  content: '';
  background: linear-gradient(91.42deg, #8fbdff, #51a2ff 31%, #2b7fff 73%, #155dfc);
  border-radius: 24px;
  position: absolute;
  inset: -1px;
  z-index: -1;
}

.recorder-btn:after {
  background: #fff;
  background-clip: content-box;
  border: 1px solid #0000;
  border-radius: 24px;
  bottom: -1px;
  content: '';
  left: -1px;
  pointer-events: none;
  position: absolute;
  right: -1px;
  top: -1px;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
  z-index: -1;
}

.waveform {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 40px;
}

.waveform-bar {
  width: 4px;
  border-radius: 2px;
  transition: height 0.1s ease-out;
}

.linear-gradient-transparency-right {
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.5) 50%,
    rgba(255, 255, 255, 1) 100%
  );
}

.linear-gradient-transparency-left {
  background: linear-gradient(
    to left,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.5) 50%,
    rgba(255, 255, 255, 1) 100%
  );
}
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
