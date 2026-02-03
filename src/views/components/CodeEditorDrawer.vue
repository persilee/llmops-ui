<script setup lang="ts">
import { useAccountStore } from '@/stores/account'
import { Theme } from '@/types/types'
import { Message } from '@arco-design/web-vue'
import { merge } from 'lodash-es'
import * as monaco from 'monaco-editor'
import { CodeEditor as MonacoCodeEditor, type EditorOptions } from 'monaco-editor-vue3'
import { nextTick, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  height?: number
  options?: EditorOptions
  isHideHeader?: boolean
  theme?: Theme
  languageName?: string
  language?: string
}>()
const visible = defineModel('visible', { type: Boolean, default: false })
const emits = defineEmits(['blur', 'change', 'focus', 'layoutChange', 'changeCursorPosition'])
const code = defineModel('code', { type: String, default: '' })
const loading = ref(false)
const store = useAccountStore()
const hasFocus = ref(false)
let editorInstance: any = null

const defaultOptions: EditorOptions = {
  // 编程语言 (javascript, typescript, python, java, html, css, json等)
  language: props.language ?? 'python',
  // 主题 (vs, vs-dark, hc-black)
  theme: props.theme ?? (store.isDark ? 'vs-dark' : 'vs'),
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

const editorOptions = merge({}, defaultOptions, props.options)

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
  const themeName = props.theme ?? (store.isDark ? Theme.vsDark : Theme.vsLight)

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
        themeData.colors['editor.background'] = '#f9fafb'
        monaco.editor.defineTheme('idle', themeData)
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

const handleClose = () => {
  visible.value = false
  document.body.classList.remove('code-editor-open')
  store.codeEditorVisible = false
}

const handleChangeTheme = () => {
  store.isDark = !store.isDark
  const theme = store.isDark ? 'vs-dark' : 'vs'
  editorOptions.theme = theme
  editorInstance?.updateOptions(editorOptions)
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

const handleChange = (value: string, event: any) => {
  emits('change', value, event)
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

const stop = watch(visible, (val) => {
  nextTick(async () => {
    loadTheme()
  })
})

onUnmounted(() => {
  stop()
})
</script>

<template>
  <a-drawer
    :width="'50vw'"
    v-model:visible="visible"
    :mask-closable="false"
    :mask="false"
    :header="false"
    :footer="false"
    :drawer-style="{}"
    body-class="m-0 p-0"
  >
    <a-spin :loading="loading" class="w-full h-full">
      <div
        v-if="visible"
        :class="`${store.isDark ? 'vs-dark bg-[#1e1e1e]' : 'bg-gray-50'} w-full h-full flex flex-col`"
      >
        <div
          v-if="!isHideHeader"
          :class="`flex items-center justify-between py-2.5 px-3 gap-1 ${store.isDark ? 'bg-[#24262b] text-white' : 'bg-gray-100 text-gray-700'}`"
        >
          <div class="flex items-center font-medium gap-1 text-base">
            <icon-code class="text-base" />{{ String(String(languageName ?? language)) }}
          </div>
          <div class="flex items-center gap-1">
            <a-tooltip content="复制代码">
              <a-button
                type="text"
                size="mini"
                :class="`${store.isDark ? 'hover:bg-[#ffffff0f]' : 'hover:bg-gray-200'} `"
                @click="copyToClipboard(code)"
              >
                <template #icon>
                  <icon-copy :class="`${store.isDark ? 'text-white' : 'text-gray-500'} w-4 h-4`" />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip :content="!store.isDark ? '黑暗模式' : '明亮模式'">
              <a-button
                type="text"
                size="mini"
                :class="`${store.isDark ? 'hover:bg-[#ffffff0f]' : 'hover:bg-gray-200'} `"
                @click="handleChangeTheme"
              >
                <template #icon>
                  <icon-sun
                    v-if="store.isDark"
                    :class="`${store.isDark ? 'text-white' : 'text-gray-500'} w-4 h-4`"
                  />
                  <icon-moon
                    v-else
                    :class="`${store.isDark ? 'text-white' : 'text-gray-500'} w-4 h-4`"
                  />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip content="关闭">
              <a-button
                type="text"
                size="mini"
                :class="`${store.isDark ? 'hover:bg-[#ffffff0f]' : 'hover:bg-gray-200'}  mr-0.5`"
                @click="handleClose"
              >
                <template #icon
                  ><icon-close :class="`${store.isDark ? 'text-white' : 'text-gray-500'} w-4 h-4`"
                /></template>
              </a-button>
            </a-tooltip>
          </div>
        </div>
        <div class="editor-container">
          <MonacoCodeEditor
            v-model:value="code"
            :height="'100%'"
            :options="editorOptions"
            @editor-did-mount="handleEditorDidMount"
            @change="handleChange"
            class="overflow-hidden"
          />
        </div>
      </div>
    </a-spin>
  </a-drawer>
</template>

<style scoped>
:deep(.monaco-enable-motion .arco-drawer-container) {
  pointer-events: none !important;
}

.monaco-enable-motion :deep(.arco-drawer) {
  pointer-events: all;
}

.editor-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 200px;
  overflow: hidden;
  padding: 16px;
}
</style>
