declare module 'markdown-it-task-lists' {
  import { PluginSimple } from 'markdown-it'
  const plugin: PluginSimple
  export default plugin
}

declare module 'vue3-markdown-it' {
  import { App, Plugin } from 'vue'

  interface Vue3MarkdownItOptions {
    options?: MarkdownIt.Options
    breaks?: boolean
    linkify?: boolean
    typographer?: boolean
    html?: boolean
  }

  const Vue3MarkdownIt: Plugin & {
    install(app: App, options?: Vue3MarkdownItOptions): void
  }

  export default Vue3MarkdownIt
}
