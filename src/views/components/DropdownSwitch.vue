<script setup lang="ts">
import { ref } from 'vue'
const emit = defineEmits(['select'])
const value = defineModel('value', { type: Boolean, default: false })
const isActive = ref(false)

const handleSelect = (v: string) => {
  value.value = Boolean(v)
  emit('select', v)
}

const popupVisibleChange = (v: boolean) => {
  isActive.value = v
}
</script>

<template>
  <a-dropdown @select="handleSelect" @popup-visible-change="popupVisibleChange" @click.stop>
    <div
      :class="`flex items-center justify-between w-20 h-6 px-2 border ${isActive ? 'border-blue-600' : 'border-gray-300'} rounded-lg hover:cursor-pointer hover:bg-gray-200`"
    >
      <div class="text-sm">{{ value ? '开启' : '关闭' }}</div>
      <icon-down class="h-3.5 w-3.5" />
    </div>
    <template #content>
      <div class="w-20">
        <a-doption :disabled="value" value="true">开启</a-doption>
        <a-doption :disabled="!value" value="false">关闭</a-doption>
      </div>
    </template>
  </a-dropdown>
</template>

<style scoped>
:deep(.arco-dropdown-option) {
  text-align: center;
  justify-content: center;
}
</style>
