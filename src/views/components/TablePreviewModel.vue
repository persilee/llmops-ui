<script setup lang="ts">
import { downloadFile } from '@/utils/util'
import { Message } from '@arco-design/web-vue'
import { useTemplateRef } from 'vue'

const props = defineProps<{
  tableData: any
}>()
const visible = defineModel('visible', { type: Boolean, default: false })

const handleCloseModal = () => {
  visible.value = false
}

const tableRef = useTemplateRef<any>('tableRef')

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
    Message.error('复制失败：' + err)
  }
}
</script>

<template>
  <a-modal
    :visible="visible"
    :width="600"
    :footer="false"
    :hide-title="true"
    :fullscreen="true"
    modal-class="bg-transparent backdrop-blur-sm"
    body-class="p-0"
    @cancel="handleCloseModal"
  >
    <div class="flex flex-col h-screen w-screen">
      <div class="flex items-center justify-between px-6 py-3 bg-white w-full">
        <div class="text-gray-700 font-medium text-base">表格</div>
        <div class="flex items-center gap-2">
          <a-tooltip content="复制">
            <a-button
              type="text"
              size="small"
              class="`hover:bg-gray-200"
              @click="copyToClipboard()"
            >
              <template #icon>
                <icon-copy class="text-gray-500 w-4.5 h-4.5" />
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
                <icon-download class="text-gray-500 w-4.5 h-4.5" />
              </template>
            </a-button>
          </a-tooltip>
          <a-tooltip content="关闭">
            <a-button type="text" size="mini" class="`hover:bg-gray-200" @click="visible = false">
              <template #icon>
                <icon-close class="text-gray-500 w-4.5 h-4.5" />
              </template>
            </a-button>
          </a-tooltip>
        </div>
      </div>
      <div class="flex-1 flex flex-col items-center justify-center overflow-hidden w-full h-full">
        <div
          class="w-fit h-fit max-w-[calc(100%-80px)] max-h-[calc(100%-80px)] bg-white rounded-lg mx-auto"
        >
          <div
            ref="tableRef"
            class="w-fit max-w-full overflow-scroll model-table rounded-lg"
            v-html="tableData"
          ></div>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<style>
.model-table table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 8px;
  overflow: hidden;
}

.model-table table th {
  font-size: 18px;
}

.model-table table td {
  font-size: 16px;
}

.model-table table th,
.model-table table td {
  padding: 16px 18px;
  border: 1px solid #c9cdd4;
  border-top: none;
  border-top: none;
  border-right: none;
  text-align: left;
}

.model-table table th {
  border-top: 1px solid #c9cdd4;
}

/* 设置最后一行的单元格圆角 */
.model-table table tbody tr:last-child td:first-child {
  border-bottom-left-radius: 8px;
}

.model-table table tbody tr:last-child td:last-child {
  border-bottom-right-radius: 8px;
}
</style>
