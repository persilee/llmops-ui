<script setup lang="ts">
import { BASE_URL } from '@/config'
import type { GetBuiltinToolsResp } from '@/services/api/builtin-tool/types'
import { formatDate } from '@/utils/format-util'

defineProps<{
  tool: GetBuiltinToolsResp
}>()
</script>

<template>
  <a-card class="cursor-pointer rounded-lg" hoverable>
    <div class="flex items-center gap-3 mb-3">
      <a-avatar :size="40" shape="square" :style="{ background: tool.background }">
        <img :src="`${BASE_URL}/builtin-tools/${tool.name}/icon`" :alt="tool.name" />
      </a-avatar>
      <div class="flex flex-col">
        <div class="text-base text-gray-900 font-bold">{{ tool.label }}</div>
        <div class="text-xs text-gray-500 line-clamp-1">
          提供商 {{ tool.name }} • {{ tool.tools.length }}
        </div>
      </div>
    </div>
    <div class="leading-[18px] text-gray-500 h-[72px] line-clamp-4 mb-2">
      {{ tool.description }}
    </div>
    <div class="flex items-center gap-1.5">
      <div class="w-4 h-4 flex items-center justify-center rounded-full bg-blue-700">
        <img src="@/assets/images/icon-user.png" class="w-2 h-2" />
      </div>
      <div class="text-xs text-gray-400">
        作者 • 发布时间{{ formatDate(tool.created_at, 'MM-DD HH:mm') }}
      </div>
    </div>
  </a-card>
</template>

<style scoped></style>
