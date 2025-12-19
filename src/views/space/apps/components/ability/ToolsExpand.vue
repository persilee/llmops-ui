<script setup lang="ts">
import type { ToolElement } from '@/services/api/apps/types'
import { copyToClipboard } from '@/utils/util'
import { ref } from 'vue'
import { useAppStore } from '../../AppView.store'
import EditToolDrawer from './EditToolDrawer.vue'
import ToolsDrawer from './ToolsDrawer.vue'

// 获取应用状态管理store实例
const store = useAppStore()
// 控制工具选择抽屉的显示状态
const visible = ref(false)
// 控制编辑工具抽屉的显示状态
const editToolVisible = ref(false)
// 加载状态，用于控制工具列表的加载动画
const loading = ref(false)
// 当前选中的工具对象，用于编辑时传递数据
const selectTool = ref<ToolElement>()

/**
 * 处理添加工具的方法
18  * @description 当用户点击添加按钮时调用，打开工具选择抽屉
 */
const handleAddTool = () => {
  visible.value = true
}

/**
 * 处理编辑工具的方法
 * @param tool - 要编辑的工具对象，包含工具的详细信息
 * @description 当用户点击编辑按钮时调用，将选中的工具信息存储到selectTool中，并打开编辑工具的抽屉
 */
const handleEditTool = (tool: ToolElement) => {
  selectTool.value = tool
  editToolVisible.value = true
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
    <a-spin :loading="loading" class="w-full h-full">
      <div v-if="store.draftAppConfig.tools.length > 0" class="flex flex-col gap-2">
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
          <a-tooltip content="复制名称">
            <a-button
              type="text"
              size="mini"
              class="opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible"
              @click="copyToClipboard(tool.provider.name)"
            >
              <template #icon><icon-copy class="text-gray-500" /></template>
            </a-button>
          </a-tooltip>
          <a-tooltip content="编辑参数">
            <a-button
              type="text"
              size="mini"
              class="opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible"
              @click="handleEditTool(tool)"
            >
              <template #icon><icon-settings class="text-gray-500" /></template>
            </a-button>
          </a-tooltip>
          <a-tooltip content="移除插件">
            <a-button
              type="text"
              size="mini"
              class="opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible"
              @click="store.removeTool(tool.provider.id)"
            >
              <template #icon><icon-delete class="text-gray-500" /></template>
            </a-button>
          </a-tooltip>
        </div>
      </div>
      <div v-else class="text-gray-500">
        插件能够让智能体调用外部
        API，例如搜索信息、浏览网页、生成图片等，扩展智能体的能力和使用场景。应用最大支持关联 5
        个知识库。
      </div>
    </a-spin>
    <!-- 新增工具抽屉 -->
    <ToolsDrawer v-model:visible="visible" />
    <!-- 设置工具抽屉 -->
    <EditToolDrawer v-model:visible="editToolVisible" :tool="selectTool" />
  </a-collapse-item>
</template>

<style scoped></style>
