<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ options?: { label: string }[] }>()
// 定义组件的事件发射器，用于向父组件传递选择事件
const emit = defineEmits(['select'])
// 定义组件的v-model双向绑定值，用于控制开关状态
const value = defineModel('value', { type: Boolean, default: false })
// 定义下拉菜单的激活状态，用于控制样式变化
const isActive = ref(false)

/**
 * 处理下拉选择事件
 * @param v - 选中的值，字符串类型的 'true' 或 'false'
 */
const handleSelect = (v: string) => {
  emit('select', v == 'true')
}

/**
 * 处理下拉菜单显示状态变化
 * @param v - 布尔值，表示下拉菜单是否显示
 */
const popupVisibleChange = (v: boolean) => {
  isActive.value = v
}
</script>

<template>
  <a-dropdown @select="handleSelect" @popup-visible-change="popupVisibleChange" @click.stop>
    <div
      :class="`flex items-center justify-between min-w-20 w-fit h-6 px-2 border ${isActive ? 'border-blue-600' : 'border-gray-300'} rounded-lg hover:cursor-pointer hover:bg-gray-200`"
    >
      <div class="text-sm">
        {{ value ? (options ? options[0].label : '开启') : options ? options[1].label : '关闭' }}
      </div>
      <icon-down class="h-3.5 w-3.5" />
    </div>
    <template #content>
      <div class="min-w-20 w-fit">
        <a-doption :disabled="value" value="true">
          {{ options ? options[0].label : '开启' }}</a-doption
        >
        <a-doption :disabled="!value" value="false">{{
          options ? options[1].label : '关闭'
        }}</a-doption>
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
