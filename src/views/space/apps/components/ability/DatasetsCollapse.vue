<script setup lang="ts">
import { copyToClipboard } from '@/utils/util'
import { ref } from 'vue'
import { useAppStore } from '../../AppView.store'
import DatasetsDrawer from './DatasetsDrawer.vue'

const store = useAppStore()
const loading = ref(false)
const visible = ref(false)

const handleAddDataset = () => {
  visible.value = true
}
</script>

<template>
  <a-collapse-item header="知识库" key="Datasets">
    <!-- 标题 -->
    <template #expand-icon="{ active }">
      <icon-right :class="`${active ? 'rotate-90' : ''} transition duration-160`" />
    </template>
    <template #extra>
      <a-tooltip content="添加知识库">
        <a-button type="text" size="mini" @click.stop="handleAddDataset">
          <template #icon>
            <icon-plus class="text-gray-500" />
          </template>
        </a-button>
      </a-tooltip>
    </template>
    <!-- 内容 -->
    <a-spin :loading="loading" class="w-full h-full">
      <div v-if="store.draftAppConfig.datasets.length > 0" class="flex flex-col gap-2">
        <div
          v-for="(dataset, idx) in store.draftAppConfig.datasets"
          :key="idx"
          class="flex items-center bg-white hover:bg-gray-200 p-2 rounded-lg transition-all duration-200 group"
        >
          <a-avatar :size="26" shape="square" class="bg-transparent">
            <img :src="dataset.icon" />
          </a-avatar>
          <div class="flex-1 ml-2 flex flex-col justify-between">
            <span class="font-bold text-gray-900">{{ dataset.name }}</span>
            <span class="text-xs text-gray-500">{{ dataset.description }}</span>
          </div>
          <a-tooltip content="复制名称">
            <a-button
              type="text"
              size="mini"
              class="opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible"
              @click="copyToClipboard(dataset.name)"
            >
              <template #icon><icon-copy class="text-gray-500" /></template>
            </a-button>
          </a-tooltip>
          <a-tooltip content="移除知识库">
            <a-button
              type="text"
              size="mini"
              class="opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible"
              @click="store.removeDataset(dataset.id)"
            >
              <template #icon><icon-delete class="text-gray-500" /></template>
            </a-button>
          </a-tooltip>
        </div>
      </div>
      <div v-else class="text-gray-500">
        将文档上传为文本知识库后，用户发送消息时，智能体能够引用文本知识中的内容回答用户问题。应用最大支持关联
        5 个知识库。
      </div>
    </a-spin>
    <DatasetsDrawer v-model:visible="visible" />
  </a-collapse-item>
</template>

<style scoped></style>
