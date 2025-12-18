<script setup lang="ts">
import { BASE_URL } from '@/config'
import type { Tool as DraftConfigTool } from '@/services/api/apps/types'
import type { GetBuiltinToolsResp, Tool } from '@/services/api/builtin-tool/types'
import { formatDate } from '@/utils/format-util'
import { typeMap } from '@/utils/util'
import { useAppStore } from '../../AppView.store'

// 定义组件的props接口
const props = defineProps<{
  loading: boolean // 加载状态，用于控制组件的加载动画显示
  builtinTools: Array<GetBuiltinToolsResp> // 内置工具列表数据，包含工具提供者和工具信息
}>()
// 初始化应用状态管理store，用于管理工具的添加、移除等操作
const store = useAppStore()
// 当前选中的工具索引
const selectIndex = defineModel('selectIndex', { type: Number, default: -1 })

// 定义组件的事件，用于向父组件发送添加工具的事件
const emit = defineEmits(['addTool'])

/**
 * 获取工具提供者的图标URL
 * @param provider - 工具提供者对象，包含提供者名称等信息
 * @returns string - 返回完整的图标URL路径
 */
const getIcon = (provider: GetBuiltinToolsResp) => {
  return `${BASE_URL}/builtin-tools/${provider.name}/icon`
}

/**
 * 检查工具是否已被添加到应用中
 * @param tool - 要检查的工具对象，包含工具的名称等信息
 * @returns boolean - 如果工具已被添加返回true，否则返回false
 */
const isAdded = (tool: Tool) => {
  return store
    .getExistingTools()
    .some((draftConfigTool: DraftConfigTool) => draftConfigTool.tool_id == tool.name)
}

/**
 * 处理工具选择状态的切换函数
 * @param idx - 当前点击的工具提供者索引
 * 功能说明：
 * - 如果点击的是已选中的工具，则取消选中（收起）
 * - 如果点击的是未选中的工具，则选中该工具（展开）
 */
const handleSelect = (idx: number) => {
  if (selectIndex.value === idx) {
    // 如果当前点击的索引与选中索引相同，则取消选中
    selectIndex.value = -1
  } else {
    // 否则，选中当前点击的工具
    selectIndex.value = idx
  }
}
</script>

<template>
  <a-spin :loading="loading" class="flex flex-col w-full h-full">
    <!-- 标题 -->
    <div class="text-lg font-bold text-gray-900 mb-4">自定义插件</div>
    <!-- 内容 -->
    <div ref="scrollContainer" class="flex-1 flex flex-col overflow-y-scroll scrollbar-w-none">
      <div class="flex flex-col w-full mb-2" v-for="(provider, idx) in builtinTools" :key="idx">
        <div :class="`${selectIndex == idx ? 'bg-gray-100 rounded-lg' : ''} flex flex-col`">
          <div
            :class="`${selectIndex == idx ? 'bg-gray-100 rounded-lg' : ''} flex flex-col  transition-all duration-360 hover:bg-gray-100 hover:rounded-lg border-b border-gray-100`"
            @click="handleSelect(idx)"
          >
            <!-- 供应商-->
            <div class="flex items-center justify-between cursor-pointer px-2.5 py-1.5 gap-3">
              <!-- logo -->
              <img
                :src="getIcon(provider)"
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
              :key="tool.name + idx"
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
                              <div v-if="input.required" class="text-xs text-yellow-600">必填</div>
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
                  @click="store.removeTool(provider.name)"
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
      <a-empty v-if="!builtinTools.length" description="暂无数据" class="mt-10" />
    </div>
  </a-spin>
</template>

<style scoped>
.hover-button {
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
