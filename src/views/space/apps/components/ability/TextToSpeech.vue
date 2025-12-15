<script setup lang="ts">
import DropdownSwitch from '@/views/components/DropdownSwitch.vue'
import * as _ from 'lodash-es'
import { ref } from 'vue'
import { useAppStore } from '../../AppView.store'
import TextToSpeechModel from './TextToSpeechModel.vue'

// 初始化应用状态管理store实例
const store = useAppStore()
// 控制文本转语音设置模态框的显示状态
const visible = ref(false)

/**
 * 处理文本转语音功能开关的回调函数
 * @param {boolean} val - 开关状态，true表示启用，false表示禁用
 */
const handleSelect = (val: boolean) => {
  // 深拷贝当前的文本转语音配置，避免直接修改原对象
  const textToSpeech = _.cloneDeep(store.draftAppConfig.text_to_speech)
  // 更新配置中的启用状态
  textToSpeech.enable = val
  // 通过store更新应用配置
  store.updateDraftAppConfig({ text_to_speech: textToSpeech })
}

/**
 * 打开文本转语音设置对话框
 */
const handleSetting = () => {
  visible.value = true
}
</script>

<template>
  <a-collapse-item header="语音输出" key="TextToSpeech">
    <!-- 标题 -->
    <template #expand-icon="{ active }">
      <icon-right :class="`${active ? 'rotate-90' : ''} transition duration-160`" />
    </template>
    <template #extra>
      <DropdownSwitch
        v-model:value="store.draftAppConfig.text_to_speech.enable"
        @select="handleSelect"
      />
    </template>
    <!-- 内容 -->
    <div v-if="store.draftAppConfig.text_to_speech.enable" class="">
      <a-button
        long
        class="bg-white border border-gray-200 hover:bg-gray-200"
        @click="handleSetting"
      >
        <template #icon>
          <icon-settings />
        </template>
        设置
      </a-button>
    </div>
    <div v-else class="text-sm text-gray-500">启用后，您可以使用语音播放 Agent 输出的内容。</div>
    <TextToSpeechModel v-model:visible="visible" />
  </a-collapse-item>
</template>

<style scoped></style>
