<script setup lang="ts">
import type { GetAPIToolProvidersWithPage } from '@/services/api/api-tool/types'
import type { Paginator } from '@/services/types'
import LoadingStatus from '@/views/components/LoadingStatus.vue'
import { computed, useTemplateRef } from 'vue'

const props = defineProps<{
  loading: boolean
  loadMorLoading: boolean
  providers: GetAPIToolProvidersWithPage[]
  paginator: Paginator
}>()
const emit = defineEmits(['handleScroll', 'loadMore', 'addTool'])

const scrollContainerRef = useTemplateRef('scrollContainer')

// 判断是否需要显示手动加载按钮
const showLoadMoreBtn = computed(() => {
  if (!scrollContainerRef.value) return false
  const container = scrollContainerRef.value
  // 当内容高度小于容器高度时显示手动按钮
  return (
    container.scrollHeight <= container.clientHeight &&
    props.paginator.current_page < props.paginator.total_page
  )
})
</script>

<template>
  <a-spin :loading="loading" class="flex flex-col w-full h-full">
    <!-- 标题 -->
    <div class="text-lg font-bold text-gray-900 mb-4">自定义插件</div>
    <!-- 内容 -->
    <div
      ref="scrollContainer"
      class="flex-1 flex flex-col overflow-y-scroll scrollbar-w-none"
      @scroll="emit('handleScroll', $event)"
    >
      <div class="" v-for="(provider, idx) in providers" :key="idx">
        <!-- 供应商名称 -->
        <div class="text-xs text-gray-700">{{ provider.name }}</div>
        <!-- 工具列表 -->
        <div class="flex flex-col py-3">
          <div
            v-for="tool in provider.tools"
            :key="tool.id"
            class="flex items-center p-1.5 rounded-lg cursor-pointer transition-all duration-360 hover:bg-gray-100 group"
          >
            <img :src="provider.icon" class="rounded-full bg-white object-cover w-5 h-5" />
            <div class="flex-1 text-xs text-gray-700 ml-2">{{ tool.name }}</div>
            <a-button
              type="outline"
              size="mini"
              class="border invisible border-gray-200 bg-white text-blue-600 opacity-0 group-hover:visible group-hover:opacity-100"
              @click="emit('addTool', provider, tool)"
            >
              <template #icon><icon-plus /></template>
              添加
            </a-button>
          </div>
        </div>
      </div>
      <!-- 空数据 -->
      <a-empty v-if="!providers.length" description="暂无数据" class="mt-10" />
      <!-- 加载和 loading -->
      <LoadingStatus
        :loading="loadMorLoading"
        :paginator="paginator"
        :has-data="providers.length > 0"
        :show-load-more-btn="showLoadMoreBtn"
        @load-more="emit('loadMore')"
      />
    </div>
  </a-spin>
</template>

<style scoped></style>
