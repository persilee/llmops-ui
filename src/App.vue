<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import GlobalLoading from './views/components/GlobalLoading.vue'
const router = useRouter()
const isLoading = ref(false)

router.beforeEach((to, from, next) => {
  // 仅在 BlankLayout → BaseLayout 时显示 Loading（可根据路由规则调整）
  const fromBlank = from.matched.some((item) => item.components?.default?.name === 'BlankLayout')
  const toBase = to.matched.some((item) => item.components?.default?.name === 'BaseLayout')
  if (fromBlank && toBase) {
    isLoading.value = true
  }
  next()
})

router.afterEach(() => {
  // 跳转完成后关闭 Loading（加小延迟避免闪屏）
  setTimeout(() => {
    isLoading.value = false
  }, 200)
})

router.onError(() => {
  isLoading.value = false
})
</script>

<template>
  <GlobalLoading :visible="isLoading" />
  <router-view />
</template>

<style scoped></style>
