<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { merge } from 'lodash-es'
import { CodeEditor as MonacoCodeEditor, type EditorOptions } from 'monaco-editor-vue3'
import { ref } from 'vue'

const props = defineProps<{
  options?: EditorOptions
  isDark?: boolean
}>()
const code = defineModel('code', { type: String, default: '' })
const emits = defineEmits(['blur', 'expand'])
const isExpand = ref(false)
const visible = ref(false)
const defaultOptions: EditorOptions = {
  // 编程语言 (javascript, typescript, python, java, html, css, json等)
  language: 'python',
  // 主题 (vs, vs-dark, hc-black)
  theme: 'vs',
  // 自动布局，容器大小变化时自动调整
  automaticLayout: true,
  // 字体大小 (px)
  fontSize: 12,
  // 行高 (可以是像素值或字体倍数)
  lineHeight: 1.6,
  // 启用字体连字
  fontLigatures: true,
  // 代码缩略图
  minimap: { enabled: false },
  // 行号显示 (on, off, relative, interval)
  lineNumbers: 'on',
  // 显示行号左侧的空白栏 (用于断点等)
  glyphMargin: false,
  // 行装饰宽度
  lineNumbersMinChars: 0,
  scrollbar: {
    // 垂直滚动条 (auto, visible, hidden)
    vertical: 'hidden',
    // 水平滚动条 (auto, visible, hidden)
    horizontal: 'hidden',
    // 垂直滚动条大小 (px)
    verticalScrollbarSize: 6,
    // 水平滚动条大小 (px)
    horizontalScrollbarSize: 6,
    // 垂直滑块大小
    verticalHasArrows: false,
    // 水平滑块大小
    horizontalHasArrows: false,
  },
  // 控制是否显示代码折叠
  folding: true,
  // 启用多光标编辑
  multiCursorMergeOverlapping: false,
  // 控制是否启用编辑上下文功能
  editContext: false,
}

const editorOptions = merge({}, defaultOptions, props.options)

const handleEditorDidMount = async (editor: any) => {
  editor.onDidBlurEditorText(() => {
    emits('blur')
  })
}

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

const handExpand = () => {
  isExpand.value = !isExpand.value
  visible.value = false
}
</script>

<template>
  <div
    :class="`${isDark ? 'vs-dark' : ''} w-full h-full flex flex-col bg-gray-100 px-2 pb-3 ${isExpand ? 'absolute top-0 left-0 bottom-0 right-0 z-200 translate-0' : ''}`"
  >
    <div class="flex items-center justify-between py-1.5 gap-1 border-b border-gray-200">
      <div class="flex items-center font-semibold text-gray-700 gap-1 text-sm">
        <icon-code class="text-base" />{{ String(editorOptions.language).toLocaleUpperCase() }}
      </div>
      <div class="flex items-center gap-0.5">
        <a-tooltip content="复制代码">
          <a-button
            type="text"
            size="mini"
            class="hover:bg-gray-200"
            @click="copyToClipboard(code)"
          >
            <template #icon><icon-copy class="text-gray-500 w-3.5 h-3.5" /></template>
          </a-button>
        </a-tooltip>
        <slot>
          <a-tooltip v-model:popup-visible="visible" :content="isExpand ? '缩小' : '放大'">
            <a-button type="text" size="mini" class="hover:bg-gray-200" @click="handExpand">
              <template #icon>
                <icon-expand v-if="!isExpand" class="text-gray-500 w-3.5 h-3.5" />
                <icon-shrink v-else class="text-gray-500 w-3.5 h-3.5" />
              </template>
            </a-button>
          </a-tooltip>
        </slot>
      </div>
    </div>
    <MonacoCodeEditor
      v-model:value="code"
      :options="editorOptions"
      @editor-did-mount="handleEditorDidMount"
      @blur="console.log('blur')"
    />
  </div>
</template>

<style scoped>
.monaco-code-editor :deep(.monaco-editor .margin) {
  background-color: transparent;
}
:deep(.monaco-editor) {
  background-color: transparent;
}

:deep(.monaco-editor.no-user-select .lines-content) {
  background-color: transparent;
}

:deep(.decorationsOverviewRuler) {
  display: none !important;
}

:deep(.monaco-editor .sticky-widget .sticky-widget-lines-scrollable) {
  background-color: #f3f4f6;
}

:deep(.monaco-editor .sticky-widget .sticky-widget-line-numbers) {
  background-color: #f3f4f6;
}

.monaco-code-editor :deep(.monaco-editor .view-lines) {
  background-color: transparent;
}

/* -------------------- */

.vs-dark .monaco-code-editor :deep(.monaco-editor .margin) {
  background-color: #1e1e1e;
}
.vs-dark :deep(.monaco-editor) {
  background-color: #1e1e1e;
}

.vs-dark :deep(.monaco-editor.no-user-select .lines-content) {
  background-color: #1e1e1e;
}

.vs-dark :deep(.decorationsOverviewRuler) {
  display: block;
}

.vs-dark :deep(.monaco-editor .sticky-widget .sticky-widget-lines-scrollable) {
  background-color: #1e1e1e;
}

.vs-dark :deep(.monaco-editor .sticky-widget .sticky-widget-line-numbers) {
  background-color: #1e1e1e;
}

.vs-dark .monaco-code-editor :deep(.monaco-editor .view-lines) {
  background-color: #1e1e1e;
}
</style>
