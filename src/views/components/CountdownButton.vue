<script setup lang="ts">
import { onUnmounted, ref } from 'vue'

const emits = defineEmits(['click'])
const buttonText = ref('发送验证码') // 默认按钮文字
const buttonType = ref('primary') // 按钮类型

// 倒计时状态控制
const isCountingDown = ref(false) // 是否正在倒计时
const isLoading = ref(false) // 发送请求时的加载状态
const countdown = ref(60) // 倒计时总秒数
let timer: number | null = null // 定时器实例

// 发送验证码/触发倒计时逻辑
const handleSendCode = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500))
  startCountdown() // 启动倒计时
  emits('click') // 触发父组件的点击事件
}

// 启动倒计时函数
const startCountdown = () => {
  isCountingDown.value = true
  countdown.value = 60 // 重置为60秒

  // 清除之前的定时器（防止重复点击创建多个定时器）
  if (timer) clearInterval(timer)

  // 创建定时器，每秒执行一次
  timer = setInterval(() => {
    countdown.value--

    // 倒计时结束
    if (countdown.value <= 0) {
      clearInterval(timer!)
      timer = null
      isCountingDown.value = false
    }
  }, 1000)
}

// 组件卸载时清除定时器（防止内存泄漏）
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <a-button
    type="primary"
    :disabled="isCountingDown"
    @click="handleSendCode"
    :loading="isLoading"
    :class="`${isCountingDown ? 'w-[138px]' : ''}`"
  >
    <!-- 倒计时中显示剩余秒数，否则显示默认文字 -->
    {{ isCountingDown ? `${countdown} 秒后重新发送` : buttonText }}
  </a-button>
</template>

<style scoped></style>
