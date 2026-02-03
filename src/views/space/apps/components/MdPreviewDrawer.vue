<script setup lang="ts">
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'
const props = defineProps<{
  text: string
}>()
const visible = defineModel('visible', { type: Boolean, default: false })

const handleClose = () => {
  visible.value = false
  document.body.classList.remove('md-preview-open')
  return false
}
</script>

<template>
  <a-drawer
    :width="'66.6vw'"
    v-model:visible="visible"
    title="人设与回复逻辑 · 预览"
    :mask-closable="false"
    :mask="false"
    :header="true"
    :footer="false"
    @before-cancel="handleClose"
  >
    <div class="px-3">
      <MdPreview :modelValue="text" />
    </div>
  </a-drawer>
</template>

<style scoped></style>
