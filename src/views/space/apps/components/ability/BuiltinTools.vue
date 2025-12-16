<script setup lang="ts">
import { BASE_URL } from '@/config'
import type { GetBuiltinToolsResp } from '@/services/api/builtin-tool/types'

const props = defineProps<{
  loading: boolean
  builtinTools: Array<GetBuiltinToolsResp>
}>()

const emit = defineEmits(['addTool'])

const getIcon = (provider: GetBuiltinToolsResp) => {
  return `${BASE_URL}/builtin-tools/${provider.name}/icon`
}
</script>

<template>
  <a-spin :loading="loading" class="flex flex-col w-full h-full">
    <!-- 标题 -->
    <div class="text-lg font-bold text-gray-900 mb-4">自定义插件</div>
    <!-- 内容 -->
    <div ref="scrollContainer" class="flex-1 flex flex-col overflow-y-scroll scrollbar-w-none">
      <div class="" v-for="(provider, idx) in builtinTools" :key="idx">
        <!-- 供应商名称 -->
        <div class="text-xs text-gray-700">{{ provider.name }}</div>
        <!-- 工具列表 -->
        <div class="flex flex-col py-3">
          <div
            v-for="(tool, idx) in provider.tools"
            :key="tool.name + idx"
            class="flex items-center p-1.5 rounded-lg cursor-pointer transition-all duration-360 hover:bg-gray-100 group"
          >
            <img :src="getIcon(provider)" class="rounded-full bg-white object-cover w-5 h-5" />
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
      <a-empty v-if="!builtinTools.length" description="暂无数据" class="mt-10" />
    </div>
  </a-spin>
</template>

<style scoped></style>
