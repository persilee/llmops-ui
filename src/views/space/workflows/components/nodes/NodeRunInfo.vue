<script setup lang="ts">
import { copyToClipboard } from '@/utils/util'
import { isEmpty } from 'lodash-es'
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'

const props = defineProps<{
  data: any
  isHideInput?: boolean
  isHideOutput?: boolean
  loading?: boolean
}>()

const handleClick = () => {
  const dataId = props.data.node_data.id
  const targetDiv = document.querySelector(`[data-id="${dataId}"]`) as HTMLElement

  const nodeDivs = document.querySelectorAll('.vue-flow__node')
  if (nodeDivs.length > 0) {
    nodeDivs.forEach((nodeDiv: any) => {
      nodeDiv.classList.remove('node-z-index')
    })
  }

  if (targetDiv) {
    targetDiv.classList.add('node-z-index')
  }
}
</script>

<template>
  <div class="mt-2 w-[360px]" @click.stop="handleClick">
    <a-spin
      v-if="isEmpty(data)"
      :loading="isEmpty(data)"
      class="rounded-lg bg-white w-full h-full px-3 py-2 border border-gray-200"
    >
    </a-spin>
    <a-collapse v-else class="rounded-lg bg-white" expand-icon-position="right">
      <a-collapse-item :key="data.id">
        <template #header>
          <div class="flex items-center justify-between w-full" @click.stop>
            <div class="flex items-center gap-1.5">
              <div
                class="bg-green-500 rounded-full w-4.5 h-4.5 flex items-center justify-center ml-1.5"
              >
                <icon-check
                  class="w-3 h-3 text-white"
                  :stroke-width="6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </div>
              <div class="text-gray-700 font-medium">运行成功</div>
              <a-tag class="rounded-md text-[#00b23c]" size="small" color="#69d18c4d"
                >{{ (data.latency as number)?.toFixed(3) }}s</a-tag
              >
            </div>
          </div>
        </template>
        <template #expand-icon="{ active }">
          <icon-down :class="`${active ? 'rotate-180' : ''} transition duration-160`" />
        </template>
        <div v-if="!isHideInput" class="flex flex-col gap-1" @click.stop>
          <div class="flex items-center gap-0.5">
            <div class="text-gray-700 font-semibold">输入</div>
            <a-tooltip content="复制输入值">
              <a-button type="text" size="mini" class="" @click="copyToClipboard(data.inputs)">
                <template #icon><icon-copy class="text-gray-700" /></template>
              </a-button>
            </a-tooltip>
          </div>
          <div v-if="!isEmpty(data.inputs)" class="border border-gray-200 rounded-md">
            <vue-json-pretty
              :data="data.inputs"
              show-length
              :deep="1"
              :show-line="false"
              class="overflow-y-scroll scrollbar-w-none flex-1 p-3 text-xs"
            />
          </div>
          <a-empty v-else description="无输入数据" />
        </div>
        <div v-if="!isHideOutput" class="flex flex-col gap-1" @click.stop>
          <div class="flex items-center gap-0.5">
            <div class="text-gray-700 font-semibold">输出</div>
            <a-tooltip content="复制输出值">
              <a-button type="text" size="mini" class="" @click="copyToClipboard('')">
                <template #icon><icon-copy class="text-gray-700" /></template>
              </a-button>
            </a-tooltip>
          </div>
          <div v-if="!isEmpty(data.outputs)" class="border border-gray-200 rounded-md">
            <vue-json-pretty
              :data="data.outputs"
              show-length
              :deep="1"
              :show-line="false"
              class="overflow-y-scroll scrollbar-w-none flex-1 p-3 text-xs"
            />
          </div>
          <a-empty v-else description="无输出数据" />
        </div>
      </a-collapse-item>
    </a-collapse>
  </div>
</template>

<style scoped></style>
