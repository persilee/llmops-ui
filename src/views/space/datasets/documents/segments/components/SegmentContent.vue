<script setup lang="ts">
import type { GetSegmentsWithPage } from '@/services/api/dataset/segments/types'
import type { Paginator } from '@/services/types'
import { formatNumberWithCommas, padWithZeros } from '@/utils/util'
import LoadingStatus from '@/views/components/LoadingStatus.vue'
import { computed, useTemplateRef } from 'vue'

/**
 * 组件属性接口定义
 */
interface Props {
  /** 加载状态 */
  loading: boolean
  /** 文档片段列表数据 */
  segments: GetSegmentsWithPage[]
  /** 分页器信息 */
  paginator: Paginator
}

/**
 * 组件事件接口定义
 */
interface Emits {
  /** 滚动事件 */
  (e: 'scroll', event: Event): void
  /** 加载更多事件 */
  (e: 'load-more'): void
  /** 切换启用状态事件 */
  (e: 'change-enabled', v: boolean,ev:Event, segment: GetSegmentsWithPage): void
  /** 删除事件 */
  (e: 'delete', segment: GetSegmentsWithPage): void
  /** 点击事件 */
  (e: 'segment-click', segment: GetSegmentsWithPage): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/** 处理滚动事件 */
const handleScroll = (event: Event) => {
  emit('scroll', event)
}

/** 处理加载更多事件 */
const handleLoadMore = () => {
  emit('load-more')
}

/** 处理启用状态切换事件 */
const handelChangeEnabled = (v: boolean | string | number,ev:Event, segment: GetSegmentsWithPage) => {
  emit('change-enabled', v as boolean, ev, segment)
}

/** 处理删除事件
 * @param segment 要删除的文档片段对象
 */
const handleDelete = (segment: GetSegmentsWithPage) => {
  emit('delete', segment)
}

const handelSegmentClick = (segment: GetSegmentsWithPage) => {
  emit('segment-click', segment)
}

// 滚动容器的模板引用，用于获取DOM元素以实现滚动监听
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
  <a-spin :loading="loading" class="block h-full w-full">
    <div
      ref="scrollContainer"
      class="w-full overflow-scroll scrollbar-w-none"
      @scroll="handleScroll"
    >
      <a-row :gutter="[20, 20]">
        <a-col :span="6" v-for="segment in segments" :key="segment.id">
          <!-- 卡片内容 -->
          <a-card hoverable class="cursor-pointer rounded-lg" @click="handelSegmentClick(segment)">
            <div class="flex flex-col">
              <!-- 头部（序号、禁用标识和切换按钮） -->
              <div class="flex items-center justify-between">
                <!-- 序号 -->
                <a-tag
                  size="small"
                  class="rounded-md bg-gray-50 border-1 border-gray-200 text-gray-400"
                  ><template #icon
                    ><img src="@/assets/images/icon-hash.png" class="w-3 h-3"
                  /></template>
                  {{ padWithZeros(segment.position) }}</a-tag
                >
                <!-- 禁用标识和切换按钮 -->
                <div class="flex items-center">
                  <!-- 左边文字和圆点 -->
                  <div class="flex gap-1">
                    <span class="text-xs text-gray-400">
                      {{ segment.enabled ? '已启用' : '已禁用' }}
                    </span>
                    <a-badge v-if="segment.enabled" status="success" />
                    <a-badge v-else status="normal" />
                  </div>
                  <!-- 中间竖线 -->
                  <a-divider direction="vertical" class="mx-1.5 min-h-2.5" />
                  <!-- 右边切换按钮 -->
                  <a-switch
                    v-model:model-value="segment.enabled"
                    size="small"
                    type="round"
                    @change="(v, ev) => handelChangeEnabled(v,ev, segment)"
                  />
                </div>
              </div>
              <!-- 中间内容 -->
              <div class="leading-[18px] text-gray-500 h-[72px] line-clamp-5 my-2">
                {{ segment.content }}
              </div>
              <!-- 底部（字符数、命中数和删除按钮） -->
              <div class="flex justify-between items-center">
                <!-- 字符数、命中数 -->
                <div class="flex gap-3">
                  <div class="flex items-center gap-1">
                    <img src="@/assets/images/icon-file.png" class="h-2.5" />
                    <div class="text-xs text-gray-400">
                      {{ formatNumberWithCommas(segment.character_count) }} 字符
                    </div>
                  </div>
                  <div class="flex items-center gap-1">
                    <img src="@/assets/images/icon-score.png" class="h-2.5" />
                    <div class="text-xs text-gray-400">
                      {{ formatNumberWithCommas(segment.hit_count) }} 命中
                    </div>
                  </div>
                </div>
                <!-- 删除按钮 -->
                <a-button
                  type="text"
                  size="mini"
                  class="text-gray-400"
                  @click.stop="handleDelete(segment)"
                >
                  <template #icon><icon-delete /></template>
                </a-button>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>
      <!-- 加载和 loading -->
      <LoadingStatus
        :loading="loading"
        :paginator="paginator"
        :has-data="segments.length > 0"
        :show-load-more-btn="showLoadMoreBtn"
        @load-more="handleLoadMore"
      />
    </div>
  </a-spin>
</template>

<style scoped></style>
