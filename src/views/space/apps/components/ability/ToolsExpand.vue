<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../../AppView.store'
import ToolsDrawer from './ToolsDrawer.vue'

const store = useAppStore()
const visible = ref(false)

const handleAddTool = () => {
  visible.value = true
}
</script>

<template>
  <a-collapse-item header="扩展插件" key="Tools">
    <!-- 标题 -->
    <template #expand-icon="{ active }">
      <icon-right :class="`${active ? 'rotate-90' : ''} transition duration-160`" />
    </template>
    <template #extra>
      <a-tooltip content="添加插件">
        <a-button type="text" size="mini" @click.stop="handleAddTool">
          <template #icon>
            <icon-plus class="text-gray-500" />
          </template>
        </a-button>
      </a-tooltip>
    </template>
    <!-- 内容 -->
    <div class="flex flex-col gap-2">
      <div
        v-for="(tool, idx) in store.draftAppConfig.tools"
        :key="idx"
        class="flex items-center bg-white hover:bg-gray-200 p-2 rounded-lg transition-all duration-200 group"
      >
        <a-avatar :size="26" shape="square" class="bg-transparent">
          <img :src="tool.provider.icon" />
        </a-avatar>
        <div class="flex-1 ml-2 flex flex-col justify-between">
          <span class="font-bold text-gray-900">{{ tool.tool.name }}</span>
          <span class="text-xs text-gray-500">{{ tool.tool.description }}</span>
        </div>
        <a-tooltip content="编辑参数">
          <a-button
            type="text"
            size="mini"
            class="opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible"
          >
            <template #icon><icon-settings class="text-gray-500" /></template>
          </a-button>
        </a-tooltip>
        <a-tooltip content="移除">
          <a-button
            type="text"
            size="mini"
            class="opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible"
          >
            <template #icon><icon-delete class="text-gray-500" /></template>
          </a-button>
        </a-tooltip>
      </div>
    </div>
    <ToolsDrawer v-model:visible="visible" />
  </a-collapse-item>
</template>

<style scoped></style>
