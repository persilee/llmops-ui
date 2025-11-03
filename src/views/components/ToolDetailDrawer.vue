<script setup lang="ts">
import { type GetAPIToolProvidersWithPage } from '@/services/api/api-tool/types'
import { type GetBuiltinToolsResp } from '@/services/api/builtin-tool/types'
import { getBackground, getIcon, getName, typeMap } from '@/utils/util'
import { useToolProviderStore } from '../space/SpaceView.store'

const props = defineProps<{
  provider?: GetBuiltinToolsResp | GetAPIToolProvidersWithPage
  loading?: boolean
}>()

const visible = defineModel<boolean>('visible', { default: false })

defineEmits(['updateToolProvider'])

const store = useToolProviderStore()
</script>

<template>
  <a-drawer
    :visible="visible"
    :width="380"
    :footer="false"
    title="工具详情"
    :drawer-style="{ background: '#F9FAFB' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="bg-gray-50" v-if="provider">
      <div class="flex items-center gap-3 mb-3">
        <a-avatar :size="40" shape="square" :style="{ background: getBackground(provider) }">
          <a-image :src="getIcon(provider)" :alt="provider.name" />
        </a-avatar>
        <div class="flex flex-col">
          <div class="text-base text-gray-900 font-bold">
            {{ getName(provider) }}
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
      <a-button
        type="outline"
        long
        class="mt-4 bg-white border-gray-300 text-gray-700"
        @click="$emit('updateToolProvider', provider)"
        :loading="loading"
      >
        <template #icon>
          <icon-settings />
        </template>
        编辑
      </a-button>
      <a-divider />
      <div class="flex flex-col gap-2">
        <div class="text-xs text-gray-500">包含 {{ provider.tools.length }} 个工具</div>
        <a-card
          v-for="tool in provider.tools"
          :key="tool.name"
          class="cursor-pointer flex flex-col rounded-xl"
        >
          <div class="font-bold text-gray-900 mb-2">{{ tool.name }}</div>
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
                  <div class="text-gray-500">{{ typeMap[input.type] }}</div>
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
