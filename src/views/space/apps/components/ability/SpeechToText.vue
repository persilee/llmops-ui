<script setup lang="ts">
import DropdownSwitch from '@/views/components/DropdownSwitch.vue'
import { useAppStore } from '../../AppView.store'

// 获取应用状态管理store实例
const store = useAppStore()

// 处理语音输入开关选择事件
// @param val - 语音输入功能的启用状态（true: 启用, false: 禁用）
const handleSelect = (val: boolean) => {
  store.updateDraftAppConfig({ speech_to_text: { enable: val } })
}
</script>

<template>
  <a-collapse-item header="语音输入" key="SpeechToText">
    <!-- 标题 -->
    <template #expand-icon="{ active }">
      <icon-right :class="`${active ? 'rotate-90' : ''} transition duration-160`" />
    </template>
    <template #extra>
      <DropdownSwitch
        v-model:value="store.draftAppConfig.speech_to_text.enable"
        @select="handleSelect"
      />
    </template>
    <!-- 内容 -->
    <div class="text-sm text-gray-500">启用后，您可以使用语音输入。</div>
  </a-collapse-item>
</template>

<style scoped></style>
