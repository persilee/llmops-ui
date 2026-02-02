<script setup lang="ts">
import { useAccountStore } from '@/stores/account'
import { Theme } from '@/types/types'
import { Message } from '@arco-design/web-vue'
import { merge } from 'lodash-es'
import * as monaco from 'monaco-editor'
import { CodeEditor as MonacoCodeEditor, type EditorOptions } from 'monaco-editor-vue3'
import { computed, nextTick, onMounted, ref } from 'vue'
import CodeEditorDrawer from './CodeEditorDrawer.vue'

const props = defineProps<{
  height?: number
  options?: EditorOptions
  isHideHeader?: boolean
  isSimpleMode?: boolean
  placeholder?: string
  theme?: Theme
  language?: string
  isPlaintext?: boolean
  background?: string
}>()
const code = defineModel('code', { type: String, default: '' })
const emits = defineEmits(['blur', 'change', 'focus', 'layoutChange', 'changeCursorPosition'])
const visible = ref(false)
const hasFocus = ref(false)
const store = useAccountStore()
const codeEditorVisible = ref(false)
let editorInstance: any = null

const defaultOptions: EditorOptions = {
  // 编程语言 (javascript, typescript, python, java, html, css, json等)
  language: props.language ?? 'python',
  // 主题 (vs, vs-dark, hc-black)
  theme: props.theme ?? (store.isEditorDark ? 'vs-dark' : 'vs'),
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
const editorHeight = computed(() => (props.height ? props.height - 46 : '100%'))

// 计算是否显示placeholder
const showPlaceholder = computed(() => {
  // 当编辑器没有内容且没有获得焦点时显示placeholder
  return !code.value && !hasFocus.value
})

// 主题映射表
const themeImports: Record<string, () => Promise<any>> = {
  monokai: () => import('monaco-themes/themes/Monokai.json'),
  github: () => import('monaco-themes/themes/GitHub.json'),
  'github-light': () => import('monaco-themes/themes/GitHub Light.json'),
  tomorrow: () => import('monaco-themes/themes/Tomorrow.json'),
  idle: () => import('monaco-themes/themes/IDLE.json'),
  'solarized-dark': () => import('monaco-themes/themes/Solarized-dark.json'),
  'solarized-light': () => import('monaco-themes/themes/Solarized-light.json'),
  Active4D: () => import('monaco-themes/themes/Active4D.json'),
}

const loadTheme = async () => {
  const themeName = props.theme ?? (store.isEditorDark ? Theme.vsDark : Theme.vsLight)

  // 如果是内置主题，直接应用
  if (['vs', 'vs-dark', 'hc-black', 'hc-light'].includes(themeName)) {
    if (themeName === 'vs') {
      monaco.editor.defineTheme('vs', {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#f9fafb',
        },
      })
    }
    monaco.editor.setTheme(themeName)
    return
  }

  // 加载第三方主题
  try {
    const importFunc = themeImports[themeName]
    if (importFunc) {
      const themeModule = await importFunc()
      const themeData = themeModule.default || themeModule

      // 定义主题
      monaco.editor.defineTheme(themeName, themeData)
      if (['idle', 'github', 'github-light', 'tomorrow', 'Active4D'].includes(themeName)) {
        themeData.colors['editor.background'] = '#999'
        monaco.editor.defineTheme(themeName, themeData)
      }

      // 应用主题
      monaco.editor.setTheme(themeName)
    }
  } catch (error) {
    console.error(`加载主题 "${themeName}" 失败：`, error)
    // 回退到默认主题
    monaco.editor.setTheme('vs')
  }
}

const handleChangeTheme = () => {
  store.isEditorDark = !store.isEditorDark
  const theme = store.isEditorDark ? 'vs-dark' : 'vs'
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
  visible.value = false
  codeEditorVisible.value = true
  document.body.classList.add('code-editor-open')
  store.codeEditorVisible = true
}

onMounted(() => {
  nextTick(() => {
    loadTheme()
  })
})
</script>

<template>
  <div
    :class="`${store.isEditorDark ? 'vs-dark bg-[#1e1e1e]' : 'bg-gray-50'} ${isSimpleMode ? 'simple' : ''} w-full h-full flex flex-col`"
  >
    <div
      v-if="!isHideHeader"
      :class="`flex items-center justify-between py-1.5 px-2 gap-1 ${store.isEditorDark ? 'bg-[#24262b] text-white' : 'bg-gray-100 text-gray-700'}`"
    >
      <div class="flex items-center font-medium gap-1">
        <icon-code class="text-sm" />{{ String(language ?? editorOptions.language) }}
      </div>
      <div class="flex items-center gap-0.5">
        <a-tooltip content="复制代码">
          <a-button
            type="text"
            size="mini"
            :class="`${store.isEditorDark ? 'hover:bg-[#ffffff0f]' : 'hover:bg-gray-200'}`"
            @click="copyToClipboard(code)"
          >
            <template #icon>
              <icon-copy
                :class="`${store.isEditorDark ? 'text-white' : 'text-gray-500'}  w-3.5 h-3.5`"
              />
            </template>
          </a-button>
        </a-tooltip>
        <a-tooltip :content="!store.isEditorDark ? '黑暗模式' : '明亮模式'">
          <a-button
            type="text"
            size="mini"
            :class="`${store.isEditorDark ? 'hover:bg-[#ffffff0f]' : 'hover:bg-gray-200'}  mr-0.5`"
            @click="handleChangeTheme"
          >
            <template #icon>
              <icon-sun
                v-if="store.isEditorDark"
                :class="`${store.isEditorDark ? 'text-white' : 'text-gray-500'}  w-3.5 h-3.5`"
              />
              <icon-moon
                v-else
                :class="`${store.isEditorDark ? 'text-white' : 'text-gray-500'}  w-3.5 h-3.5`"
              />
            </template>
          </a-button>
        </a-tooltip>
        <slot>
          <a-tooltip v-model:popup-visible="visible" :content="'放大'">
            <a-button
              type="text"
              size="mini"
              :class="`${store.isEditorDark ? 'hover:bg-[#ffffff0f]' : 'hover:bg-gray-200'}`"
              @click="handExpand"
            >
              <template #icon>
                <icon-expand
                  :class="`${store.isEditorDark ? 'text-white' : 'text-gray-500'}  w-3.5 h-3.5`"
                />
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
    <CodeEditorDrawer
      v-model:visible="codeEditorVisible"
      v-model:code="code"
      :language="language"
      :options="{ language: language }"
      @blur="emits('blur')"
    />
  </div>
</template>

<style scoped>
.editor-container {
  position: relative;
  width: 100%;
  height: 100%;
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

.simple :deep(.monaco-editor) {
  left: -14px !important;
}

:deep(.decorationsOverviewRuler) {
  display: none !important;
}
</style>
