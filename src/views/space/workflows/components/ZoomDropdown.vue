<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
  zoomValue: number
}>()

// 定义组件的事件发射器，用于向父组件传递选择事件
const emit = defineEmits(['select'])
// 定义下拉菜单的激活状态，用于控制样式变化
const isActive = ref(false)

const zoomOptions = [
  { label: '缩小', value: 'zoomOut' },
  { label: '放大', value: 'zoomIn' },
  { label: '自适应', value: 'auto' },
  { label: '', value: '' },
  { label: '缩放到 200%', value: 2 },
  { label: '缩放到 150%', value: 1.5 },
  { label: '缩放到 100%', value: 1 },
  { label: '缩放到 50%', value: 0.5 },
]
const selectedOption = ref<{ label: string; value: number | string }>({ label: '100%', value: 1 })

const handleSelect = (option: { label: string; value: number | string }) => {
  isActive.value = false
  selectedOption.value = option
  emit('select', option)
}

/**
 * 处理下拉菜单显示状态变化
 * @param v - 布尔值，表示下拉菜单是否显示
 */
const popupVisibleChange = (v: boolean) => {
  isActive.value = v
}

const handleDocumentClick = () => {
  isActive.value = false
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <a-trigger
    v-model:popup-visible="isActive"
    trigger="click"
    :unmount-on-close="false"
    :popup-translate="[0, -16]"
    position="top"
    @popup-visible-change="popupVisibleChange"
    @click.stop
  >
    <div
      :class="`flex items-center justify-between w-20 h-6 px-2 border ${isActive ? 'border-blue-600' : 'border-gray-300'} rounded-md hover:cursor-pointer hover:bg-gray-200`"
    >
      <div class="text-sm">{{ (zoomValue * 100).toFixed(0) }}%</div>
      <icon-down class="h-3.5 w-3.5" />
    </div>
    <template #content>
      <div class="px-1 py-2 bg-white rounded-md shadow-sm border border-gray-200">
        <div v-for="option in zoomOptions" :key="option.value">
          <div v-if="option.value === ''" class="">
            <a-divider class="my-2" />
          </div>
          <div
            v-else
            class="py-2 px-3 cursor-pointer hover:bg-gray-100 rounded-md"
            @click="handleSelect(option)"
          >
            {{ option.label }}
          </div>
        </div>
      </div>
    </template>
  </a-trigger>
</template>

<style scoped>
:deep(.arco-dropdown-option) {
  text-align: center;
  justify-content: center;
}
</style>
