<script setup lang="ts">
import type { GetAPIToolProvidersWithPage, Tool } from '@/services/api/api-tool/types'
import type { Tool as DraftConfigTool } from '@/services/api/apps/types'
import type { Paginator } from '@/services/types'
import { formatDate } from '@/utils/format-util'
import { typeMap } from '@/utils/util'
import LoadingStatus from '@/views/components/LoadingStatus.vue'
import { computed, useTemplateRef } from 'vue'
import { useAppStore } from '../../AppView.store'

// 定义组件的props类型
const props = defineProps<{
  loading: boolean // 整体加载状态
  loadMorLoading: boolean // 加载更多时的加载状态
  providers: GetAPIToolProvidersWithPage[] // 工具提供商列表
  paginator: Paginator // 分页信息
}>()

// 当前选中的工具索引
const selectIndex = defineModel('selectIndex', { type: Number, default: -1 })
// 定义组件可以触发的事件
const emit = defineEmits(['handleScroll', 'loadMore', 'addTool'])
// 获取应用状态管理store
const store = useAppStore()
// 定义当前选中的工具提供商索引

// 获取滚动容器的模板引用
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

/**
 * 检查工具是否已被添加
 * @param tool 待检查的工具对象
 * @returns {boolean} 如果工具已被添加返回true，否则返回false
 */
const isAdded = (tool: Tool) => {
  return store
    .getExistingTools() // 获取已添加的工具列表
    .some((draftConfigTool: DraftConfigTool) => draftConfigTool.tool_id == tool.id) // 检查是否存在匹配的工具ID
}

/**
 * 处理工具提供商的选择状态切换
 * @param {number} idx - 要切换的工具提供商索引
 * @description
 * - 如果点击的项已经是选中状态，则取消选中（设置为-1）
 * - 如果点击的项未选中，则将其设置为选中状态
 * - 实现了单选效果，同时只能选中一个工具提供商
 */
const handleSelect = (idx: number) => {
  if (selectIndex.value === idx) {
    selectIndex.value = -1
  } else {
    selectIndex.value = idx
  }
}
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
      <div class="flex flex-col w-full mb-2" v-for="(provider, idx) in providers" :key="idx">
        <div :class="`${selectIndex == idx ? 'bg-gray-100 rounded-lg' : ''} flex flex-col`">
          <div
            :class="`${selectIndex == idx ? 'bg-gray-100 rounded-lg' : ''} flex flex-col  transition-all duration-360 hover:bg-gray-100 hover:rounded-lg border-b border-gray-100`"
            @click="handleSelect(idx)"
          >
            <!-- 供应商-->
            <div class="flex items-center justify-between cursor-pointer px-2.5 py-1.5 gap-3">
              <!-- logo -->
              <img
                :src="provider.icon"
                class="rounded-lg bg-white object-cover w-8 h-8 flex-shrink-0"
              />
              <!-- 中间的标题等信息 -->
              <div class="flex-1 flex flex-col min-w-0">
                <div class="font-bold text-gray-900">{{ provider.name }}</div>
                <div class="text-gray-700 text-xs mt-0.5 line-clamp-1 overflow-ellipsis">
                  {{ provider.description }}
                </div>
                <div class="text-gray-700 text-xs font-thin mt-1">
                  发布于 {{ formatDate(provider.created_at, 'YYYY-MM-DD HH:mm') }}
                </div>
              </div>
              <!-- 右边的图标 -->
              <icon-right
                :class="`${selectIndex == idx ? 'rotate-90' : ''} text-gray-500 flex-shrink-0 transition duration-160`"
              />
            </div>
          </div>
          <!-- 工具列表 -->
          <div v-show="selectIndex == idx" class="border-t border-gray-200">
            <div
              v-for="(tool, tIdx) in provider.tools"
              :key="tool.id"
              :class="`${isAdded(tool) ? 'bg-gray-100' : ''} flex flex-col ml-11 px-2.5 py-2 ${tIdx != provider.tools.length - 1 ? 'border-b border-gray-200' : ''}`"
            >
              <div class="flex">
                <div class="flex-1 flex flex-col gap-1 min-w-0">
                  <div class="font-bold text-gray-700 line-clamp-1 overflow-ellipsis">
                    {{ tool.name }}
                  </div>
                  <div
                    class="flex-1 text-xs text-gray-600 mr-2 line-clamp-2 overflow-ellipsis mb-2.5"
                  >
                    {{ tool.description }}
                  </div>
                  <div
                    v-if="tool.inputs.length > 0"
                    class="flex items-center overflow-y-scroll scrollbar-w-none gap-1"
                  >
                    <a-popover>
                      <template #content>
                        <div class="flex flex-col gap-3 max-w-[300px]">
                          <div
                            v-for="(input, iIndex) in tool.inputs"
                            :key="iIndex"
                            class="flex flex-col gap-1"
                          >
                            <div class="flex items-center gap-1.5">
                              <div class="font-bold text-gray-800">{{ input.name }}</div>
                              <div class="text-xs text-gray-600">
                                {{ typeMap[input.type] }}
                              </div>
                              <div v-if="input.required == 'true'" class="text-xs text-yellow-600">
                                必填
                              </div>
                            </div>
                            <div class="text-gray-600 text-xs">{{ input.description }}</div>
                          </div>
                        </div>
                      </template>
                      <div class="text-xs text-blue-600 mr-1 flex-shrink-0 cursor-pointer">
                        参数
                      </div>
                    </a-popover>
                    <div
                      v-for="(input, iIdx) in tool.inputs"
                      :key="iIdx"
                      class="text-xs text-gray-500 font-medium bg-gray-200 px-1.5 py-0.5 rounded-md"
                    >
                      {{ input.name }}
                    </div>
                  </div>
                </div>
                <a-button
                  v-if="!isAdded(tool)"
                  type="outline"
                  size="mini"
                  class="border border-gray-200 bg-white text-blue-600 self-center"
                  @click="emit('addTool', provider, tool)"
                >
                  <template #icon><icon-plus /></template>
                  添加
                </a-button>
                <a-button
                  v-else
                  type="outline"
                  size="mini"
                  class="border border-gray-200 bg-gray-100 text-gray-400 hover-button self-center"
                  @click="store.removeTool(provider.id)"
                >
                  <span class="default-text"><icon-plus /> 已添加</span>
                  <span class="hover-text"><icon-delete /> 移除</span>
                </a-button>
              </div>
            </div>
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

<style scoped>
.hover-button {
  position: relative;
  min-width: 66px;
}

.hover-button .default-text,
.hover-button .hover-text {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  transition:
    visibility 0.2s,
    opacity 0.2s;
}

.hover-button .default-text {
  visibility: visible;
  opacity: 1;
}

.hover-button .hover-text {
  visibility: hidden;
  opacity: 0;
  color: red;
}

.hover-button:hover .default-text {
  visibility: hidden;
  opacity: 0;
}

.hover-button:hover .hover-text {
  visibility: visible;
  opacity: 1;
}

/* 调整图标位置，避免文本切换时图标移动 */
.hover-button .arco-btn-icon {
  margin-right: 4px;
}
</style>
