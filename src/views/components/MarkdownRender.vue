<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import markdownItTaskLists from 'markdown-it-task-lists'
import { h, nextTick, ref, render, watch } from 'vue'
import CodePreview from './CodePreview.vue'

interface Props {
  source: string
  options?: {
    html?: boolean
    linkify?: boolean
    typographer?: boolean
  }
}

const props = withDefaults(defineProps<Props>(), {
  options: () => ({
    html: true,
    linkify: true,
    typographer: true,
  }),
})

const md = new MarkdownIt({
  html: props.options.html,
  linkify: props.options.linkify,
  typographer: props.options.typographer,
  breaks: true,
})

md.use(markdownItTaskLists, { enabled: true })

// 重写「代码块（fence）」的渲染规则
md.renderer.rules.fence = function (tokens, idx, options, env, self) {
  const token = tokens[idx] // 获取当前代码块的 Token
  const lang = token.info.trim() || 'plaintext' // 提取代码语言（如 ```python → lang="python"）
  const code = token.content // 提取代码内容

  // 自定义渲染逻辑：返回 <div> 结构（替换默认的 <pre><code>）
  // 注意：必须转义代码中的特殊字符（如 < > &），避免 XSS 风险
  const escapedCode = md.utils.escapeHtml(code) // 转义特殊字符（核心）

  // 返回自定义的 HTML（这里用 <div> 包裹代码，保留语言类名）
  return `
    <CodePreview
      data-code="${escapedCode}"
      data-lang="${lang}"
    >
    </CodePreview>
  `
}

// 存储渲染后的 HTML（包含占位符）
const renderedMarkdown = ref('')
// 存储 Markdown 根元素的 DOM 引用
const markdownRoot = ref<HTMLElement | null>(null)

// 动态挂载 Vue 组件：将占位符替换为 CodeEditor 组件
const mountCodeBlocks = async () => {
  // 等待 DOM 更新（确保占位符已渲染到页面）
  await nextTick()

  // 找到所有自定义占位符
  const placeholders = markdownRoot.value?.querySelectorAll('codepreview')
  if (!placeholders) return

  // 遍历占位符，逐个挂载 Vue 组件
  placeholders.forEach((placeholder) => {
    // 从 data-* 提取元数据（解码之前的 encodeURIComponent）

    const language = placeholder.getAttribute('data-lang') ?? ''
    const code = decodeURIComponent(placeholder.getAttribute('data-code') ?? '')

    const codeBlockVNode = h(CodePreview, {
      language,
      code,
    })
    // 创建一个新的div作为挂载点
    const mountPoint = document.createElement('div')
    placeholder.parentElement?.replaceChild(mountPoint, placeholder)

    // 使用render函数挂载组件
    render(codeBlockVNode, mountPoint)
  })
}

watch(
  () => props.source,
  (newValue) => {
    renderedMarkdown.value = md.render(newValue)
    mountCodeBlocks()
  },
  { immediate: true },
)
</script>

<template>
  <div ref="markdownRoot" class="markdown-body" v-html="renderedMarkdown"></div>
</template>

<style>
@import 'github-markdown-css/github-markdown-light.css';

.markdown-body {
  background-color: transparent;
  font-size: 14px;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  font-weight: 600;
  margin-bottom: 0.5em;
}

.markdown-body h1 {
  font-size: 1.5em;
}

.markdown-body h2 {
  font-size: 1.25em;
}

.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  font-size: 1em;
}

.markdown-body pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.markdown-body pre code {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.markdown-body ol,
.markdown-body ul,
.markdown-body menu {
  list-style: inherit;
}
</style>
