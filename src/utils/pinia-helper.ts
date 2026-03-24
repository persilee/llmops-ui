import { getActivePinia } from 'pinia'

export function clearAllPiniaStores() {
  const pinia = getActivePinia()
  if (!pinia) return

  Object.keys(pinia.state.value).forEach((storeId) => {
    // 使用类型断言访问内部属性 _s
    const store = (pinia as any)._s.get(storeId)

    if (!store) return

    // 优先级：自定义 reset > $reset > 清空 state
    if (typeof store.reset === 'function') {
      store.reset() // 调用自定义清空方法
    } else {
      pinia.state.value[storeId] = {} // 兜底清空
    }
  })
}
