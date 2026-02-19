<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import markdownItTaskLists from 'markdown-it-task-lists'
import { h, nextTick, ref, render, watch } from 'vue'
import CodePreview from './CodePreview.vue'
import FancyboxView from './FancyboxView.vue'
import TablePreview from './TablePreview.vue'

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

md.renderer.rules.image = function (tokens, idx, options, env, self) {
  const token = tokens[idx]
  // 获取图片属性
  const src = token.attrGet('src')

  return `
    <FancyboxView data-src="${src}">
    </FancyboxView>
  `
}

// 保存原来的表格渲染规则
const originalTableOpen =
  md.renderer.rules.table_open ||
  function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options)
  }
const originalTableClose =
  md.renderer.rules.table_close ||
  function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options)
  }
// 自定义表格渲染，替换为自定义组件标签

md.renderer.rules.table_open = function (tokens, idx, options, env, self) {
  return '<TablePreview>' + originalTableOpen(tokens, idx, options, env, self)
}
md.renderer.rules.table_close = function (tokens, idx, options, env, self) {
  return originalTableClose(tokens, idx, options, env, self) + '</TablePreview>'
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

/**
 * 将 Markdown 渲染后的表格替换为自定义的 TablePreview 组件
 * 该函数会查找所有 tablepreview 占位符，提取其中的表格数据，
 * 然后使用 Vue 的 render 函数将 TablePreview 组件挂载到占位符位置
 */
const mountTable = async () => {
  // 等待 DOM 更新完成，确保占位符元素已被渲染到页面中
  await nextTick()

  // 在 markdownRoot 容器中查找所有 tablepreview 自定义占位符元素
  const placeholders = markdownRoot.value?.querySelectorAll('tablepreview')
  // 如果没有找到任何占位符，直接返回，不执行后续操作
  if (!placeholders) return

  // 遍历所有找到的占位符元素
  placeholders.forEach((placeholder) => {
    // 从当前占位符中查找实际的 table 元素
    const table = placeholder.querySelector('table')
    // 如果没有找到 table 元素，跳过当前占位符
    if (!table) return

    // 创建 TablePreview 组件的虚拟节点，传入表格的 HTML 字符串作为 tableData 属性
    const tableVNode = h(TablePreview, { tableData: table.outerHTML })

    // 创建一个新的div作为挂载点
    const mountPoint = document.createElement('div')
    // mountPoint.className = 'w-fit'
    placeholder.parentElement?.replaceChild(mountPoint, placeholder)
    // 使用 Vue 的 render 函数将 TablePreview 组件渲染到占位符元素中
    render(tableVNode, mountPoint)
    // 移除原有的 table 元素，避免重复渲染
    table.remove()
  })
}

const mountImage = async () => {
  // 等待 DOM 更新完成，确保占位符元素已被渲染到页面中
  await nextTick()

  // 找到所有自定义占位符
  const placeholders = markdownRoot.value?.querySelectorAll('fancyboxview')
  if (!placeholders) return
  placeholders.forEach((placeholder) => {
    const src = placeholder.getAttribute('data-src') ?? ''
    const imageVNode = h(FancyboxView, { imgSrc: src })
    // 创建一个新的div作为挂载点
    const mountPoint = document.createElement('div')
    placeholder.parentElement?.replaceChild(mountPoint, placeholder)

    // 使用render函数挂载组件
    render(imageVNode, mountPoint)
  })
}

watch(
  () => props.source,
  (newValue) => {
    renderedMarkdown.value = md.render(newValue)
    mountCodeBlocks()
    mountTable()
    mountImage()
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
  max-width: fit-content;
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
  border-bottom: none;
}

.markdown-body h2 {
  font-size: 1.25em;
  border-bottom: none;
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

.markdown-body table {
  width: auto;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 0 0 8px 8px;
  border-right: 1px solid #c9cdd4;
  margin-bottom: 0px;
}

.markdown-body table th,
.markdown-body table td {
  text-align: left;
  border: 1px solid #c9cdd4;
  border-top: none;
  border-right: none;
}

.markdown-body table th {
  border-top: 1px solid #c9cdd4;
}

.markdown-body table tr,
.markdown-body table tr:nth-child(2n),
.markdown-body table th {
  background-color: transparent;
}

/* 设置最后一行的第一个单元格的左下角圆角 */
.markdown-body tbody tr:last-child td:first-child {
  border-bottom-left-radius: 8px;
}

/* 设置最后一行的最后一个单元格的右下角圆角 */
.markdown-body tbody tr:last-child td:last-child {
  border-bottom-right-radius: 8px;
}

.markdown-body li,
.markdown-body a {
  word-wrap: break-word;
  word-break: break-all;
  max-width: 100%;
}
</style>
