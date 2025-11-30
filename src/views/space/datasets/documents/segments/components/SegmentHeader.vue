<script setup lang="ts">
import type { GetDocumentResp } from '@/services/api/dataset/documents/type'
import { formatDate } from '@/utils/format-util'
import { getFileIcon } from '@/utils/util'

/**
 * 组件属性接口定义
 */
interface Props {
  loading: boolean
  document: GetDocumentResp | null | undefined
}

/**
 * 组件事件接口定义
 */
interface Emits {
  (e: 'back-click'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleBackClick = () => {
  emit('back-click')
}
</script>

<template>
  <!-- 返回、标题、标签 -->
  <div class="flex items-center w-full gap-2 mb-6">
    <!-- 返回按钮 -->
    <a-button size="mini" type="text" class="text-gray-700" @click="handleBackClick">
      <template #icon><icon-left /></template>
    </a-button>
    <!-- 图标、标题、标签 -->
    <a-skeleton :loading="loading" :animation="true">
      <div class="flex items-center gap-3">
        <a-skeleton-shape class="w-[40px] h-[40px] rounded-lg" />
        <div class="flex flex-col justify-between h-[40px]">
          <a-skeleton-line :widths="['260px']" />
          <div class="flex items-center gap-2">
            <a-skeleton-line :rows="1" :widths="['80px']" :line-height="14" />
            <a-skeleton-line :rows="1" :widths="['100px']" :line-height="14" />
            <a-skeleton-line :rows="1" :widths="['120px']" :line-height="14" />
          </div>
        </div>
      </div>
    </a-skeleton>
    <div v-if="!loading" class="flex items-center gap-3">
      <div class="bg-white border border-gray-300 rounded-lg p-2">
        <img :src="getFileIcon({ filename: document?.name })" class="w-[25px] h-[28px]" />
      </div>
      <div class="flex flex-col justify-between h-[40px]">
        <div class="text-gray-700">文档 / {{ document?.name }}</div>
        <div class="flex items-center gap-2">
          <a-tag size="small" class="rounded h-[18px] leading-[18px] bg-gray-200 text-gray-500"
            >{{ document?.segment_count }} 文档片段</a-tag
          >
          <a-tag size="small" class="rounded h-[18px] leading-[18px] bg-gray-200 text-gray-500"
            >{{ document?.hit_count }} 命中</a-tag
          >
          <a-tag size="small" class="rounded h-[18px] leading-[18px] bg-gray-200 text-gray-500"
            >{{ formatDate(document?.updated_at, 'YYYY-MM-DD HH:mm') }} 最后编辑</a-tag
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
