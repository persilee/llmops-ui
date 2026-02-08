<script setup lang="ts">
import { downloadFile } from '@/utils/util'
import { Message } from '@arco-design/web-vue'
import { ref, useTemplateRef } from 'vue'
import TablePreviewModel from './TablePreviewModel.vue'

const props = defineProps<{
  tableData: any
}>()
const tableRef = useTemplateRef<any>('tableRef')
const visible = ref(false)

const copyToClipboard = async () => {
  try {
    if (!tableRef.value) return

    const text = tableRef.value.textContent || tableRef.value.innerText
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
  <div class="flex-1 flex flex-col mt-3 max-w-full overflow-hidden rounded-lg">
    <div class="h-[40px] bg-[#818b981f] flex items-center justify-between py-2 px-3">
      <div class="text-gray-700 font-semibold">表格</div>
      <div class="flex items-center gap-2">
        <a-tooltip content="复制">
          <a-button type="text" size="small" class="`hover:bg-gray-200" @click="copyToClipboard()">
            <template #icon>
              <icon-copy class="text-gray-500 w-4 h-4" />
            </template>
          </a-button>
        </a-tooltip>
        <a-tooltip content="下载">
          <a-button
            type="text"
            size="mini"
            class="`hover:bg-gray-200"
            @click="downloadFile(tableRef)"
          >
            <template #icon>
              <icon-download class="text-gray-500 w-4 h-4" />
            </template>
          </a-button>
        </a-tooltip>
        <a-tooltip content="全屏预览">
          <a-button type="text" size="mini" class="`hover:bg-gray-200" @click="visible = true">
            <template #icon>
              <icon-expand class="text-gray-500 w-4 h-4" />
            </template>
          </a-button>
        </a-tooltip>
      </div>
    </div>
    <div ref="tableRef" class="w-full min-w-0" v-html="tableData"></div>
    <TablePreviewModel v-model:visible="visible" :table-data="tableData" />
  </div>
</template>

<style scoped></style>
