<script setup lang="ts">
import DropdownSwitch from '@/views/components/DropdownSwitch.vue'
import { useAppStore } from '../../AppView.store'

// 获取应用状态管理store实例
const store = useAppStore()

/**
 * 处理建议功能开关选择事件
 * @param {boolean} val - 开关状态，true表示开启，false表示关闭
 * @returns {void}
 */
const handleSelect = (val: boolean) => {
  // 更新应用配置中的建议功能开关状态
  store.updateDraftAppConfig({ suggested_after_answer: { enable: val } })
}
</script>

<template>
  <a-collapse-item header="用户问题建议" key="SuggestedAfterAnswer">
    <!-- 标题 -->
    <template #expand-icon="{ active }">
      <icon-right :class="`${active ? 'rotate-90' : ''} transition duration-160`" />
    </template>
    <template #extra>
      <DropdownSwitch
        v-model:value="store.draftAppConfig.suggested_after_answer.enable"
        @select="handleSelect"
      />
    </template>
    <!-- 内容 -->
    <div class="text-sm text-gray-500">
      {{
        store.draftAppConfig.suggested_after_answer.enable
          ? '在智能体回复后，自动根据对话内容提供 3 条用户提问建议'
          : '在每次智能体回复后，不会提供任何用户问题建议'
      }}
    </div>
  </a-collapse-item>
</template>

<style scoped></style>
