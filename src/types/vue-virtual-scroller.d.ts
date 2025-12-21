declare module 'vue-virtual-scroller' {
  import { DefineComponent } from 'vue'

  interface ScrollerItem {
    id: string | number
    [key: string]: any
  }

  const DynamicScroller: DefineComponent<{
    items: ScrollerItem[]
    minItemSize?: number
    [key: string]: any
  }>

  const DynamicScrollerItem: DefineComponent<{
    item: ScrollerItem
    active: boolean
    dataIndex: number | string
    [key: string]: any
  }>

  export { DynamicScroller, DynamicScrollerItem }
}
