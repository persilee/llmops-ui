<script setup lang="ts">
import type { Paginator } from '@/services/types'

interface Props {
  loading: boolean
  paginator: Paginator
  hasData: boolean
  showLoadMoreBtn: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  loadMore: []
}>()
</script>

<template>
  <!-- 加载 loading -->
  <a-row v-if="hasData" class="mt-4">
    <a-col
      v-if="paginator.current_page < paginator.total_page && loading"
      :span="24"
      align="center"
    >
      <a-spin tip="加载中..." />
    </a-col>
    <!-- 没有更多数据时显示 -->
    <a-col
      v-if="
        !loading && paginator.current_page >= paginator.total_page && paginator.current_page > 1
      "
      :span="24"
      align="center"
    >
      <div class="text-gray-400 my-4">没有更多数据了</div>
    </a-col>
    <!-- 大屏幕手动显示加载更多按钮 -->
    <a-col v-if="showLoadMoreBtn" align="center">
      <a-button @click="emit('loadMore')" type="text" class="text-gray-400">加载更多</a-button>
    </a-col>
  </a-row>
</template>

<style scoped></style>
