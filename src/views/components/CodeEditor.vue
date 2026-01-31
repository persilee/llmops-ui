<script setup lang="ts">
import { useAccountStore } from '@/stores/account'
import { Message } from '@arco-design/web-vue'
import { merge } from 'lodash-es'
import * as monaco from 'monaco-editor'
import { CodeEditor as MonacoCodeEditor, type EditorOptions } from 'monaco-editor-vue3'
import { computed, onMounted, ref } from 'vue'

const props = defineProps<{
  height?: number
  options?: EditorOptions

  placeholder?: string
  language?: string
  isPlaintext?: boolean
}>()
const code = defineModel('code', { type: String, default: '' })
const emits = defineEmits(['blur', 'change', 'focus', 'layoutChange', 'changeCursorPosition'])
const isExpand = ref(false)
const visible = ref(false)
const hasFocus = ref(false)
const store = useAccountStore()
let editorInstance: any = null
const defaultOptions: EditorOptions = {
  // 编程语言 (javascript, typescript, python, java, html, css, json等)
  language: 'python',
  // 主题 (vs, vs-dark, hc-black)
  theme: store.isDark ? 'vs-dark' : 'vs-light',
  // 自动布局，容器大小变化时自动调整
  automaticLayout: true,
  // 字体大小 (px)
  fontSize: 12,
  // 行高 (可以是像素值或字体倍数)
  lineHeight: '18px',
  // 启用字体连字
  fontLigatures: true,
  // 代码缩略图
  minimap: { enabled: false },
  // 行号显示 (on, off, relative, interval)
  lineNumbers: 'on',
  // 显示行号左侧的空白栏 (用于断点等)
  glyphMargin: false,
  // 行装饰宽度
  lineNumbersMinChars: 2,
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
  // 自动换行 (off, on, wordWrapColumn, bounded)
  wordWrap: 'on',
}

const plaintextOptions = {
  renderLineHighlight: 'none', // 当前行高亮显示方式：'none'表示不显示高亮
  renderLineHighlightOnlyWhenFocus: false, // 是否仅在获得焦点时显示行高亮
  overviewRulerBorder: false, // 是否显示概览标尺边框
  hideCursorInOverviewRuler: true, // 是否在概览标尺中隐藏光标
  unicodeHighlight: {
    ambiguousCharacters: false, // 是否高亮显示可能有歧义的Unicode字符
  },
  quickSuggestions: false, // 关闭快速提示（如代码补全）
  parameterHints: false, // 关闭参数提示
  wordBasedSuggestions: false, // 关闭基于单词的提示
  suggestions: false, // 关闭所有建议
  diagnosticsOptions: {
    enableSyntaxValidation: false, // 关闭语法验证
    enableSemanticValidation: false, // 关闭语义验证
    suppressWarnings: true, // 关闭所有警告
    suppressInformation: true, // 关闭所有信息提示
  },
  stickyScroll: { enabled: false }, // 关闭粘性滚动
}

// 合并默认配置和纯文本模式配置
const options = merge({}, defaultOptions, props.isPlaintext ? plaintextOptions : {})

// 合并基础配置和传入的自定义配置
const editorOptions = merge({}, options, props.options)

// 计算编辑器高度：如果传入height属性，根据是否展开状态返回不同高度；否则默认100%
const editorHeight = computed(() =>
  props.height ? (isExpand.value ? '100%' : props.height - 46) : '100%',
)

// 计算是否显示placeholder
const showPlaceholder = computed(() => {
  // 当编辑器没有内容且没有获得焦点时显示placeholder
  return !code.value && !hasFocus.value
})

const handleChangeTheme = () => {
  store.isDark = !store.isDark
  const theme = store.isDark ? 'vs-dark' : 'vs-light'
  editorOptions.theme = theme
  editorInstance?.updateOptions(editorOptions)
}

const handleEditorDidMount = async (editor: any) => {
  editorInstance = editor

  editor.onDidBlurEditorText(() => {
    emits('blur')
    hasFocus.value = false
  })
  editor.onDidFocusEditorText(() => {
    emits('focus')
    hasFocus.value = true
  })

  // 监听编辑器尺寸变化
  editor.onDidLayoutChange(() => {
    emits('layoutChange', editorInstance)
  })

  // 监听光标位置变化
  editor.onDidChangeCursorPosition(() => {
    emits('changeCursorPosition', editorInstance)
  })
}

const handleChange = (value: string, event: any) => {
  emits('change', value, event)
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

onMounted(() => {
  monaco.editor.defineTheme('vs-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#f9fafb',
    },
  })
})
</script>

<template>
  <div
    :class="`${store.isDark ? 'vs-dark bg-[#1e1e1e]' : 'bg-gray-50'} w-full h-full flex flex-col ${isExpand ? 'absolute top-0 left-0 bottom-0 right-0 z-200 translate-0' : ''}`"
  >
    <div
      :class="`flex items-center justify-between py-1.5 px-2 gap-1 ${store.isDark ? 'bg-[#24262b] text-white' : 'bg-gray-100 text-gray-700'}`"
    >
      <div class="flex items-center font-semibold gap-1 text-sm">
        <icon-code class="text-base" />{{
          String(language ?? editorOptions.language).toLocaleUpperCase()
        }}
      </div>
      <div class="flex items-center gap-0.5">
        <a-tooltip content="复制代码">
          <a-button
            type="text"
            size="mini"
            :class="`${store.isDark ? 'hover:bg-[#ffffff0f]' : 'hover:bg-gray-200'} `"
            @click="copyToClipboard(code)"
          >
            <template #icon>
              <icon-copy :class="`${store.isDark ? 'text-white' : 'text-gray-500'}  w-3.5 h-3.5`" />
            </template>
          </a-button>
        </a-tooltip>
        <a-tooltip :content="!store.isDark ? '黑暗模式' : '明亮模式'">
          <a-button
            type="text"
            size="mini"
            :class="`${store.isDark ? 'hover:bg-[#ffffff0f]' : 'hover:bg-gray-200'}  mr-0.5`"
            @click="handleChangeTheme"
          >
            <template #icon>
              <icon-sun
                v-if="store.isDark"
                :class="`${store.isDark ? 'text-white' : 'text-gray-500'}  w-3.5 h-3.5`"
              />
              <icon-moon
                v-else
                :class="`${store.isDark ? 'text-white' : 'text-gray-500'}  w-3.5 h-3.5`"
              />
            </template>
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
    <div class="editor-container">
      <MonacoCodeEditor
        v-model:value="code"
        :height="editorHeight"
        :options="editorOptions"
        @editor-did-mount="handleEditorDidMount"
        @change="handleChange"
        class="overflow-hidden"
      />
      <div
        v-if="showPlaceholder"
        :class="`editor-placeholder pl-8 text-[${editorOptions.fontSize}px] text-gray-400 leading-[${editorOptions.lineHeight}]`"
      >
        {{ placeholder ?? '请输入代码' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-container {
  position: relative;
  width: 100%;
  min-height: 200px;
  overflow: hidden;
}

.editor-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: flex-start;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
  z-index: 1;
}
</style>
