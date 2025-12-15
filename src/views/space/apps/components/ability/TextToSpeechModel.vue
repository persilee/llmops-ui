<script setup lang="ts">
import type { TextToSpeech } from '@/services/api/apps/types'
import * as _ from 'lodash-es'
import { onUnmounted, ref, watch } from 'vue'
import { useAppStore } from '../../AppView.store'

const store = useAppStore()
const visible = defineModel('visible', { type: Boolean, default: false })
const updateLoading = ref(false)
const formData = ref<TextToSpeech>({
  enable: false,
  voice: 'echo',
  auto_play: false,
})

const handleCloseModal = () => {
  visible.value = false
}

// TODO: 待语音合成服务上线后，补充提交逻辑
const handleSubmit = () => {}

// 监听模态框的显示状态
const stop = watch(visible, (val) => {
  // 当模态框打开时，从store中克隆审核配置数据到表单数据中
  if (val) {
    formData.value = _.cloneDeep(store.draftAppConfig.text_to_speech)
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
    :width="520"
    title="语音输出"
    title-align="start"
    :footer="false"
    modal-class="rounded-xl"
    @cancel="handleCloseModal"
  >
    <div class="">
      <a-form :model="formData" layout="vertical" @submit="handleSubmit">
        <a-form-item
          label="音色设置"
          field="voice"
          asterisk-position="end"
          :rules="[{ required: true, message: '音色设置不能为空' }]"
        >
          <a-select v-model="formData.voice" placeholder="请选择音色...">
            <a-option>echo</a-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="自动播放"
          field="auto_play"
          asterisk-position="end"
          :rules="[{ required: true, message: '自动播放设置不能为空' }]"
        >
          <a-switch v-model="formData.auto_play" type="round" size="small" />
        </a-form-item>
        <!-- 底部按钮 -->
        <div class="flex justify-end mt-4">
          <a-button
            type="outline"
            class="border-gray-300 text-gray-500 mr-3"
            @click="handleCloseModal"
            >取消</a-button
          >
          <a-button :loading="updateLoading" type="primary" class="" html-type="submit"
            >保存</a-button
          >
        </div>
      </a-form>
    </div>
  </a-modal>
</template>

<style scoped></style>
