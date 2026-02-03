<script setup lang="ts">
import { useAccountStore } from '@/stores/account'
import type { Theme } from '@/types/types'
import { Message } from '@arco-design/web-vue'
import hljs from 'highlight.js'
import { onMounted, ref } from 'vue'
import CodeEditorDrawer from './CodeEditorDrawer.vue'
const props = defineProps<{
  height?: number
  code: string
  theme?: Theme
  language?: string
}>()
const store = useAccountStore()
const visible = ref(false)
const codeEditorVisible = ref(false)

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

const handleChangeTheme = () => {
  store.isDark = !store.isDark
}

const handExpand = () => {
  visible.value = false
  codeEditorVisible.value = true
  document.body.classList.add('code-editor-open')
  store.codeEditorVisible = true
}

onMounted(() => {
  const codeEls = document.querySelectorAll(`.language-${props.language}`)
  if (codeEls.length > 0) {
    codeEls.forEach((codeEl) => {
      if (codeEl instanceof HTMLElement) {
        hljs.highlightElement(codeEl)
      }
    })
  }
})
</script>

<template>
  <div
    :class="`${store.isDark ? 'vs-dark bg-[#1e1e1e]' : 'bg-gray-50'}  w-full h-full flex flex-col mb-4 border border-gray-200 rounded-xl overflow-clip`"
  >
    <div
      :class="`flex items-center justify-between py-1 px-4 gap-1 ${store.isDark ? 'bg-[#24262b] text-white' : 'bg-[#818b981f] text-gray-600'}`"
    >
      <div class="flex items-center font-medium gap-1 text-xs">
        <icon-code class="text-xs" />{{ language }}
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
              <icon-copy :class="`${store.isDark ? 'text-white' : 'text-gray-500'} w-3 h-3`" />
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
                :class="`${store.isDark ? 'text-white' : 'text-gray-500'} w-3 h-3`"
              />
              <icon-moon
                v-else
                :class="`${store.isDark ? 'text-white' : 'text-gray-500'} w-3 h-3`"
              />
            </template>
          </a-button>
        </a-tooltip>
        <slot>
          <a-tooltip v-model:popup-visible="visible" content="放大">
            <a-button
              type="text"
              size="mini"
              :class="`${store.isDark ? 'hover:bg-[#ffffff0f]' : 'hover:bg-gray-200'} `"
              @click="handExpand"
            >
              <template #icon>
                <icon-expand :class="`${store.isDark ? 'text-white' : 'text-gray-500'} w-3 h-3`" />
              </template>
            </a-button>
          </a-tooltip>
        </slot>
      </div>
    </div>
    <div :class="`code-container ${store.isDark ? 'github-dark' : 'github'}`">
      <pre><code :class="`language-${language}`">{{ code }}</code></pre>
    </div>
    <CodeEditorDrawer
      v-model:visible="codeEditorVisible"
      :code="code"
      :language="language"
      :options="{ language: language }"
    />
  </div>
</template>

<style>
.code-container.github pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  margin-bottom: 0px;
  padding: 4px;
  background-color: #f6f8fa;
}
.code-container.github pre code.hljs {
  display: block;
  overflow-x: auto;
  padding: 1em;
}
.code-container.github code.hljs {
  padding: 3px 5px;
}

.code-container.github .hljs {
  color: #24292e;
  background-color: #f6f8fa;
}
.code-container.github .hljs-doctag,
.code-container.github .hljs-keyword,
.code-container.github .hljs-meta .hljs-keyword,
.code-container.github .hljs-template-tag,
.code-container.github .hljs-template-variable,
.code-container.github .hljs-type,
.code-container.github .hljs-variable.language_ {
  color: #d73a49;
}
.code-container.github .hljs-title,
.code-container.github .hljs-title.class_,
.code-container.github .hljs-title.class_.inherited__,
.code-container.github .hljs-title.function_ {
  color: #6f42c1;
}
.code-container.github .hljs-attr,
.code-container.github .hljs-attribute,
.code-container.github .hljs-literal,
.code-container.github .hljs-meta,
.code-container.github .hljs-number,
.code-container.github .hljs-operator,
.code-container.github .hljs-variable,
.code-container.github .hljs-selector-attr,
.code-container.github .hljs-selector-class,
.code-container.github .hljs-selector-id {
  color: #005cc5;
}
.code-container.github .hljs-regexp,
.code-container.github .hljs-string,
.code-container.github .hljs-meta .code-container.github .hljs-string {
  color: #032f62;
}
.code-container.github .hljs-built_in,
.code-container.github .hljs-symbol {
  color: #e36209;
}
.code-container.github .hljs-comment,
.code-container.github .hljs-code,
.code-container.github .hljs-formula {
  color: #6a737d;
}
.code-container.github .hljs-name,
.code-container.github .hljs-quote,
.code-container.github .hljs-selector-tag,
.code-container.github .hljs-selector-pseudo {
  color: #22863a;
}
.code-container.github .hljs-subst {
  color: #24292e;
}
.code-container.github .hljs-section {
  color: #005cc5;
  font-weight: bold;
}
.code-container.github .hljs-bullet {
  color: #735c0f;
}
.code-container.github .hljs-emphasis {
  color: #24292e;
  font-style: italic;
}
.code-container.github .hljs-strong {
  color: #24292e;
  font-weight: bold;
}
.code-container.github .hljs-addition {
  color: #22863a;
  background-color: #f0fff4;
}
.code-container.github .hljs-deletion {
  color: #b31d28;
  background-color: #ffeef0;
}
.code-container.github .hljs-char.escape_,
.hljs-link,
.hljs-params,
.hljs-property,
.hljs-punctuation,
.hljs-tag {
  color: #005cc5;
}
/* ----------------------dark-------------------------- */
.code-container.github-dark pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  margin-bottom: 0px;
  padding: 4px;
  background: #0d1117;
}
.code-container.github-dark pre code.hljs {
  display: block;
  overflow-x: auto;
  padding: 1em;
}
.code-container.github-dark code.hljs {
  padding: 3px 5px;
}
.code-container.github-dark .hljs {
  color: #c9d1d9;
  background: #0d1117;
}
.code-container.github-dark .hljs-doctag,
.code-container.github-dark .hljs-keyword,
.code-container.github-dark .hljs-meta .hljs-keyword,
.code-container.github-dark .hljs-template-tag,
.code-container.github-dark .hljs-template-variable,
.code-container.github-dark .hljs-type,
.code-container.github-dark .hljs-variable.language_ {
  color: #ff7b72;
}
.code-container.github-dark .hljs-title,
.code-container.github-dark .hljs-title.class_,
.code-container.github-dark .hljs-title.class_.inherited__,
.code-container.github-dark .hljs-title.function_ {
  color: #d2a8ff;
}
.code-container.github-dark .hljs-attr,
.code-container.github-dark .hljs-attribute,
.code-container.github-dark .hljs-literal,
.code-container.github-dark .hljs-meta,
.code-container.github-dark .hljs-number,
.code-container.github-dark .hljs-operator,
.code-container.github-dark .hljs-variable,
.code-container.github-dark .hljs-selector-attr,
.code-container.github-dark .hljs-selector-class,
.code-container.github-dark .hljs-selector-id {
  color: #79c0ff;
}
.code-container.github-dark .hljs-regexp,
.code-container.github-dark .hljs-string,
.code-container.github-dark .hljs-meta .hljs-string {
  color: #a5d6ff;
}
.code-container.github-dark .hljs-built_in,
.code-container.github-dark .hljs-symbol {
  color: #ffa657;
}
.code-container.github-dark .hljs-comment,
.code-container.github-dark .hljs-code,
.code-container.github-dark .hljs-formula {
  color: #8b949e;
}
.code-container.github-dark .hljs-name,
.code-container.github-dark .hljs-quote,
.code-container.github-dark .hljs-selector-tag,
.code-container.github-dark .hljs-selector-pseudo {
  color: #7ee787;
}
.code-container.github-dark .hljs-subst {
  color: #c9d1d9;
}
.code-container.github-dark .hljs-section {
  color: #1f6feb;
  font-weight: bold;
}
.code-container.github-dark .hljs-bullet {
  color: #f2cc60;
}
.code-container.github-dark .hljs-emphasis {
  color: #c9d1d9;
  font-style: italic;
}
.code-container.github-dark .hljs-strong {
  color: #c9d1d9;
  font-weight: bold;
}
.code-container.github-dark .hljs-addition {
  color: #aff5b4;
  background-color: #033a16;
}
.code-container.github-dark .hljs-deletion {
  color: #ffdcd7;
  background-color: #67060c;
}
.code-container.github-dark .hljs-char.escape_,
.hljs-link,
.hljs-params,
.hljs-property,
.hljs-punctuation,
.hljs-tag {
  color: #005cc5;
}
</style>
