<script setup lang="ts">
import DropdownSwitch from '@/views/components/DropdownSwitch.vue'
import { useAppStore } from '../../AppView.store'

// 获取应用状态管理store实例
const store = useAppStore()

/**
 * 处理长期记忆开关状态变更
 * @param val - 开关的新状态值，true表示开启，false表示关闭
 */
const handleSelect = (val: boolean) => {
  // 更新应用配置中的长期记忆启用状态
  store.updateDraftAppConfig({ long_term_memory: { enable: val } })
}
</script>

<template>
  <a-collapse-item header="长期记忆" key="LongTermMemory">
    <!-- 标题 -->
    <template #expand-icon="{ active }">
      <icon-right :class="`${active ? 'rotate-90' : ''} transition duration-160`" />
    </template>
    <template #extra>
      <DropdownSwitch
        v-model:value="store.draftAppConfig.long_term_memory.enable"
        @select="handleSelect"
      />
    </template>
    <!-- 内容 -->
    <div class="text-sm text-gray-500">总结聊天对话的内容，并用于更好的响应用户的消息。</div>
  </a-collapse-item>
</template>

<style scoped></style>
