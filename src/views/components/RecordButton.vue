<script setup lang="ts">
import AudioApi from '@/services/api/audio'
import { Message } from '@arco-design/web-vue'
import AudioRecorder from 'js-audio-recorder'
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
const audioBlob = ref<any>(null)
// 录制的音频URL
const recordedAudioUrl = ref('')

// 音频相关变量
let recorder: AudioRecorder | null = null
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let mediaStreamSource: MediaStreamAudioSourceNode | null = null
let animationId: number | null = null

/**
 * 初始化录音实例
 */
const initRecorder = () => {
  recorder = new AudioRecorder({
    sampleBits: 16, // 采样位数，支持8或16
    sampleRate: 16000, // 采样率
    numChannels: 1, // 声道数，支持1或2
  })
}

const handleRecording = async () => {
  if (isRecording.value) {
    await stopRecording()
  }
  // emits('success')
}

// 开始录音
const startRecording = async () => {
  try {
    // 请求麦克风权限
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true },
    })

    if (!recorder) initRecorder()

    // 请求麦克风权限并开始录音
    await recorder?.start()
    // 初始化音频上下文
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    analyser = audioContext.createAnalyser()

    // 设置FFT大小，控制波纹精度
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.8 // 波纹平滑度

    // 连接音频节点
    mediaStreamSource = audioContext.createMediaStreamSource(stream)
    mediaStreamSource.connect(analyser)

    // 开始更新波纹
    isRecording.value = true
    updateWaveform()
  } catch (error) {
    console.log(error)

    Message.warning('请允许麦克风权限以使用录音功能')
  }
}

// 停止录音
const stopRecording = async () => {
  isRecording.value = false

  // 清理动画
  if (animationId) cancelAnimationFrame(animationId)
  // 清理音频资源
  if (mediaStreamSource) mediaStreamSource.disconnect()
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close()
  }

  if (recorder) {
    await recorder.stop()
    audioBlob.value = recorder.getWAVBlob()
    recordedAudioUrl.value = URL.createObjectURL(audioBlob.value)
    // downloadAudio()
    const resp = await AudioApi.audioToText(audioBlob.value)
    console.log('aaaaaaaaaaaa', resp)

    // 销毁录音实例，清理资源
    recorder.destroy()
    recorder = null
  }

  // 重置波纹
  waveformData.value = Array(36).fill(8)
}

const downloadAudio = () => {
  if (!audioBlob.value) return
  const a = document.createElement('a')
  a.href = recordedAudioUrl.value

  a.download = `recorded-audio-${new Date().getTime()}.${audioBlob.value.type.split('/')[1]}`
  a.click()
  // 释放URL资源
  URL.revokeObjectURL(recordedAudioUrl.value)
}

// 更新波纹数据
const updateWaveform = () => {
  if (!isRecording.value || !recorder || !analyser) return

  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  analyser.getByteFrequencyData(dataArray)

  // 取前36个数据点，映射为波纹高度(8-40px)
  waveformData.value = Array.from(dataArray.slice(0, 36)).map((value: number) => {
    return Math.max(8, (value / 255) * 40)
  })

  animationId = requestAnimationFrame(updateWaveform)
}

// 获取波纹条颜色（从浅紫到深紫渐变）
const getBarColor = (index: number) => {
  const totalBars = waveformData.value.length
  // 紫色色相范围，根据索引调整亮度
  const hue = 188 + (index / totalBars) * 30
  const saturation = 100
  const lightness = 46 + (index / totalBars) * 36

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
})
</script>

<template>
  <div
    v-if="visible"
    :class="`flex flex-1 items-center justify-center min-h-[48px] rounded-full cursor-pointer ${type == 'button' ? 'recorder-btn' : ''}`"
    @click="handleRecording"
  >
    <div class="waveform relative">
      <div class="w-[60px] h-[40px] absolute left-[-16px] linear-gradient-transparency-left"></div>
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
  background: linear-gradient(
    91.42deg,
    hsl(188, 78%, 84%),
    hsl(188, 78%, 84%) 31%,
    hsl(215, 100%, 78%) 73%,
    hsl(215, 100%, 78%)
  );
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
</style>
