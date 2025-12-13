<script setup lang="ts">
import DropdownSwitch from '@/views/components/DropdownSwitch.vue'
import { useAppStore } from '../../AppView.store'

const store = useAppStore()

const handleSelect = (val: string) => {
  console.log(val)
}
</script>

<template>
  <a-collapse-item header="长期记忆" key="1">
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
