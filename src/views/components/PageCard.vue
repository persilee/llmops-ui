<script setup lang="ts">
import { type GetAPIToolProvidersWithPage } from '@/services/api/api-tool/types'
import { type GetBuiltinToolsResp } from '@/services/api/builtin-tool/types'
import type { GetDatasetsWithPage } from '@/services/api/dataset/types'
import { formatDate } from '@/utils/format-util'
import { getBackground, getIcon, getName, getSubLabel } from '@/utils/util'

defineProps<{
  data: GetBuiltinToolsResp | GetAPIToolProvidersWithPage | GetDatasetsWithPage
  dateLabel?: string
}>()
</script>

<template>
  <a-card class="cursor-pointer rounded-lg" hoverable>
    <div class="flex flex-row items-center gap-3 mb-3">
      <a-image
        class="w-10 h-10 rounded-lg"
        fit="cover"
        :src="getIcon(data)"
        :alt="data.name"
        :style="{ background: getBackground(data) }"
      />
      <div class="flex flex-col">
        <div class="text-base text-gray-900 font-bold">{{ getName(data) }}</div>
        <div class="text-xs text-gray-500 line-clamp-1">
          {{ getSubLabel(data) }}
        </div>
      </div>
      <div class="ml-auto"><slot></slot></div>
    </div>
    <div class="leading-[18px] text-gray-500 h-[72px] line-clamp-4 mb-2">
      {{ data.description }}
    </div>
    <div class="flex items-center gap-1.5">
      <div class="w-4 h-4 flex items-center justify-center rounded-full bg-blue-700">
        <img src="@/assets/images/icon-user.png" class="w-2 h-2" />
      </div>
      <div class="text-xs text-gray-400">
        User • {{ dateLabel ?? '发布时间' }} {{ formatDate(data.created_at, 'MM-DD HH:mm') }}
      </div>
    </div>
  </a-card>
</template>

<style scoped></style>
