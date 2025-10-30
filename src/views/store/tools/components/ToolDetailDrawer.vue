<script setup lang="ts">
import { BASE_URL } from '@/config'
import type { GetBuiltinToolsResp } from '@/services/api/builtin-tool/types'

defineProps<{
  provider: GetBuiltinToolsResp | null
}>()

const visible = defineModel<boolean>('visible', { default: false })
</script>

<template>
  <a-drawer
    :visible="visible"
    :width="380"
    :footer="false"
    title="工具详情"
    :drawer-style="{ background: '#F9FAFB' }"
  >
    <div class="" v-if="provider">
      <div class="flex items-center gap-3 mb-3">
        <a-avatar :size="40" shape="square" :style="{ background: provider.background }">
          <img :src="`${BASE_URL}/builtin-tools/${provider.name}/icon`" :alt="provider.name" />
        </a-avatar>
        <div class="flex flex-col">
          <div class="text-base text-gray-900 font-bold">
            {{ provider.label }}
          </div>
          <div class="text-xs text-gray-500 line-clamp-1">
            提供商 {{ provider.name }} •
            {{ provider.tools.length }}
          </div>
        </div>
      </div>
      <div class="leading-[18px] text-gray-500">
        {{ provider.description }}
      </div>
      <a-divider />
      <div class="flex flex-col">
        <div class="mb-3 text-xs text-gray-500">包含 {{ provider.tools.length }} 个工具</div>
        <a-card
          v-for="tool in provider.tools"
          :key="tool.name"
          class="cursor-pointer flex flex-col rounded-xl"
        >
          <div class="font-bold text-gray-900 mb-2">{{ tool.label }}</div>
          <div class="text-gray-500 text-xs">{{ tool.description }}</div>
          <div v-if="tool.inputs.length > 0" class="">
            <div class="flex items-center gap-2 my-4">
              <div class="text-xs text-gray-500 font-bold">参数</div>
              <hr class="flex-1 border-gray-200" />
            </div>
            <div class="flex flex-col gap-4">
              <div v-for="input in tool.inputs" :key="input.name" class="flex flex-col gap-2">
                <div class="flex items-center gap-2 text-xs">
                  <div class="text-gray-900 font-bold">{{ input.name }}</div>
                  <div class="text-gray-500">{{ input.type }}</div>
                  <div class="text-red-700">{{ input.required ? '必填' : '' }}</div>
                </div>
                <div class="text-xs text-gray-500">{{ input.description }}</div>
              </div>
            </div>
          </div>
        </a-card>
      </div>
    </div>
  </a-drawer>
</template>

<style scoped></style>
