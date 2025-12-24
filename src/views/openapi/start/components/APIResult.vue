<script setup lang="ts">
import type { CharReq } from '@/services/api/openapi/types'
import { Message } from '@arco-design/web-vue'
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'

const props = defineProps<{
  loading: boolean
  code: string
  result: any
  reqData: CharReq
}>()

const emits = defineEmits(['handleRun'])

const copyToClipboard = async (text: string) => {
  try {
    // 使用Clipboard API将文本复制到剪贴板
    await navigator.clipboard.writeText(text)

    // 复制成功时显示成功提示消息
    Message.success('复制成功')
  } catch (err) {
    // 复制失败时捕获错误并显示失败提示消息
    Message.error('复制失败' + err)
  }
}
</script>

<template>
  <div class="flex-1 flex flex-col py-6">
    <div class="flex flex-col rounded-lg bg-[#272b3a]">
      <div class="flex items-center justify-between h-11 py-2 px-3 border-b border-gray-700">
        <div class="text-white text-base font-medium">Curl Request</div>
        <div class="flex items-center gap-1.5">
          <a-tooltip content="复制">
            <a-button
              size="mini"
              type="text"
              class="text-white hover:bg-black/20"
              @click="copyToClipboard(code)"
            >
              <template #icon><icon-copy /></template>
            </a-button>
          </a-tooltip>
          <a-button
            :loading="loading"
            size="mini"
            type="primary"
            class="rounded-md"
            @click="emits('handleRun')"
          >
            <template #icon>
              <icon-play-arrow-fill class="transform translate-y-[1px]" />
            </template>
            运行
          </a-button>
        </div>
      </div>
      <highlightjs language="shell" :code="code" class="text-wrap" />
    </div>
    <div
      class="flex flex-col rounded-lg mt-4 flex-1 min-h-0 border border-gray-200"
      title="返回结果"
    >
      <div class="flex items-center justify-between border-b border-gray-200 px-3.5 py-1.5">
        <div class="font-bold text-gray-800">返回结果</div>
        <div class="flex items-center">
          <a-tag v-if="result" size="small" color="green" class="rounded-sm shadow-xs">{{
            reqData.stream ? 'success' : result.code
          }}</a-tag>
          <a-tooltip content="复制">
            <a-button
              type="text"
              class="text-gray-800"
              @click="copyToClipboard(JSON.stringify(result))"
            >
              <template #icon><icon-copy /></template>
            </a-button>
          </a-tooltip>
        </div>
      </div>
      <div
        v-if="reqData.stream == true && result"
        class="overflow-y-scroll scrollbar-w-none flex-1 px-3.5 py-3"
      >
        <a-collapse>
          <a-collapse-item v-for="(item, idx) in result" :key="idx">
            <template #header>
              <a-tag size="small" color="green" class="rounded-sm shadow-xs">
                {{ item.event }}
              </a-tag>
            </template>
            <vue-json-pretty
              :data="item.data"
              show-icon
              show-length
              class="overflow-y-scroll scrollbar-w-none flex-1 px-3.5 py-3"
            />
          </a-collapse-item>
        </a-collapse>
      </div>
      <vue-json-pretty
        v-else-if="reqData.stream == false && result"
        :data="result"
        show-icon
        show-length
        class="overflow-y-scroll scrollbar-w-none flex-1 px-3.5 py-3"
      />
      <a-empty v-else class="flex-1 flex flex-col justify-center items-center" />
    </div>
  </div>
</template>

<style scoped></style>
