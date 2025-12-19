<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../../AppView.store'

const store = useAppStore()
const loading = ref(false)
const handleAddWorkflow = () => {}
</script>

<template>
  <a-collapse-item header="工作流" key="Workflows">
    <!-- 标题 -->
    <template #expand-icon="{ active }">
      <icon-right :class="`${active ? 'rotate-90' : ''} transition duration-160`" />
    </template>
    <template #extra>
      <a-tooltip content="添加工作流">
        <a-button type="text" size="mini" @click.stop="handleAddWorkflow">
          <template #icon>
            <icon-plus class="text-gray-500" />
          </template>
        </a-button>
      </a-tooltip>
    </template>
    <!-- 内容 -->
    <a-spin :loading="loading" class="w-full h-full">
      <div v-if="store.draftAppConfig.workflows.length > 0" class="flex flex-col gap-2"></div>
      <div v-else class="text-gray-500">
        工作流支持通过可视化的方式，对插件、大语言模型、代码块等功能进行组合，从而实现复杂、稳定的业务流程编排，例如旅行规划、报告分析等。
      </div>
    </a-spin>
  </a-collapse-item>
</template>

<style scoped></style>
