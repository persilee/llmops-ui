<script setup lang="ts">
import icon1 from '@/assets/images/icon-avatar-speech-1.png'
import icon2 from '@/assets/images/icon-avatar-speech-2.png'
import icon3 from '@/assets/images/icon-avatar-speech-3.png'
import icon4 from '@/assets/images/icon-avatar-speech-4.png'
import SpeechButton from '@/views/components/SpeechButton.vue'
import { cloneDeep } from 'lodash-es'
import { onUnmounted, ref, watch } from 'vue'
import { useAppStore } from '../../AppView.store'

const store = useAppStore()
const visible = defineModel('visible', { type: Boolean, default: false })
const updateLoading = ref(false)
const textToSpeech = ref()
const speechVoice = ref(0)
const voiceList = ref([
  { label: ' 温柔男声 ', value: 4179, icon: icon1, text: ' 您好，今天天气舒适，适合出门走走哦 ' },
  { label: ' 阳光女声 ', value: 4146, icon: icon2, text: ' 新的一天开始啦，愿你拥有满满好心情 ' },
  { label: ' 温柔女声 ', value: 6567, icon: icon3, text: ' 轻轻道一声早安，愿你今天一切顺利 ' },
  { label: ' 开朗女声 ', value: 4189, icon: icon2, text: ' 今天也要元气满满，一起加油向前冲呀 ' },
  { label: ' 活泼女声 ', value: 4194, icon: icon2, text: ' 哈喽呀，快来看看今天有什么趣事吧 ' },
  { label: ' 开朗男声 ', value: 4193, icon: icon1, text: ' 愿你今天事事顺心，每天都有小惊喜 ' },
  { label: ' 磁性男声 ', value: 4195, icon: icon4, text: ' 这里有一段美文，想和你慢慢品读 ' },
  { label: ' 甜美女声 ', value: 4196, icon: icon2, text: ' 告诉你小秘密，今天会有好事发生哦 ' },
  { label: ' 知性女声 ', value: 4197, icon: icon3, text: ' 一起来看看今天的热点资讯内容吧 ' },
  { label: ' 年轻男声 ', value: 4156, icon: icon1, text: ' 最新动态来啦，一起来了解一下吧 ' },
])

const handleCloseModal = () => {
  visible.value = false
}

const handleSubmit = () => {
  textToSpeech.value.voice = speechVoice.value
  store.updateDraftAppConfig({ text_to_speech: textToSpeech.value })
  handleCloseModal()
}

const handleClick = (voice: number) => {
  speechVoice.value = voice
}

// 监听模态框的显示状态
const stop = watch(visible, (val) => {
  // 当模态框打开时，从store中克隆审核配置数据到表单数据中
  if (val) {
    textToSpeech.value = cloneDeep(store.draftAppConfig.text_to_speech)
    speechVoice.value = textToSpeech.value.voice
  }
})

onUnmounted(() => {
  // 组件卸载时，停止监听
  stop()
})
</script>

<template>
  <a-modal
    :visible="visible"
    :width="575"
    title="选择语音输出音色"
    title-align="start"
    :footer="false"
    modal-class="rounded-xl"
    @cancel="handleCloseModal"
  >
    <div class="">
      <div class="grid grid-cols-3 gap-4">
        <div
          v-for="voice in voiceList"
          :key="voice.value"
          :class="`flex items-center gap-2 p-1.5 border transition-all duration-300 rounded-lg cursor-pointer hover:bg-gray-50 ${speechVoice == voice.value ? 'border-blue-600' : 'border-gray-200'}`"
          @click="handleClick(voice.value)"
        >
          <a-avatar :size="36" shape="square">
            <img :src="voice.icon" />
          </a-avatar>
          <div class="text-gray-600 mr-3">{{ voice.label }}</div>
          <SpeechButton :text="voice.text" :voice="voice.value" size="32" @click.stop>
            <icon-play-circle-fill class="text-2xl text-gray-300" />
          </SpeechButton>
        </div>
      </div>
      <!-- 底部按钮 -->
      <div class="flex justify-end mt-4">
        <a-button
          type="outline"
          class="border-gray-300 text-gray-500 mr-3"
          @click="handleCloseModal"
          >取消</a-button
        >
        <a-button :loading="updateLoading" type="primary" @click="handleSubmit">保存</a-button>
      </div>
    </div>
  </a-modal>
</template>

<style scoped></style>
