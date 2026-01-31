<script setup lang="ts">
import type { GetConversationsResp } from '@/services/api/web-app/types'
import { onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  conversation: GetConversationsResp | undefined | null
}>()
const visible = defineModel('visible', { type: Boolean, default: false })
const name = ref('')
const emits = defineEmits(['updateName'])
const handleCloseModal = () => {
  visible.value = false
}

const handleSubmit = () => {
  emits('updateName', name.value)
  handleCloseModal()
}

const stop = watch(
  () => props.conversation,
  (newVal) => {
    if (newVal) {
      name.value = newVal.name
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  stop()
})
</script>

<template>
  <a-modal
    :visible="visible"
    :width="520"
    :title="'编辑对话名称'"
    title-align="start"
    :footer="false"
    modal-class="rounded-xl"
    @cancel="handleCloseModal"
  >
    <a-input v-model="name" placeholder="请输入对话名称"></a-input>
    <div class="flex justify-end mt-5">
      <a-button type="outline" class="border-gray-300 text-gray-500 mr-3" @click="handleCloseModal"
        >取消</a-button
      >
      <a-button type="primary" class="" @click="handleSubmit">确定</a-button>
    </div>
  </a-modal>
</template>

<style scoped></style>
