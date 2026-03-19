<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{
  size?: number
  isBlinking?: boolean
  eyeColor?: string
  pupilSize?: number
  pupilColor?: string
  forceLookX?: number
  forceLookY?: number
  maxDistance?: number
}>()
const mouseX = ref(0)
const mouseY = ref(0)
const eyeRef = ref<HTMLDivElement | null>(null)

const calculatePupilPosition = () => {
  if (!eyeRef.value) return { x: 0, y: 0 }

  // 若提供了强制看向方向，则使用该方向而非鼠标追踪
  if (props.forceLookX !== undefined && props.forceLookY !== undefined) {
    return { x: props.forceLookX, y: props.forceLookY }
  }

  const eye = eyeRef.value.getBoundingClientRect()
  const eyeCenterX = eye.left + eye.width / 2
  const eyeCenterY = eye.top + eye.height / 2

  const deltaX = mouseX.value - eyeCenterX
  const deltaY = mouseY.value - eyeCenterY
  const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), props.maxDistance ?? 10)

  const angle = Math.atan2(deltaY, deltaX)
  const x = Math.cos(angle) * distance
  const y = Math.sin(angle) * distance

  return { x, y }
}

// 用computed缓存瞳孔位置（响应式依赖变化自动更新）
const pupilPosition = computed(() => calculatePupilPosition())

const handleMouseMove = (e: MouseEvent) => {
  mouseX.value = e.clientX
  mouseY.value = e.clientY
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<template>
  <!-- 眼球容器：绑定ref，控制大小/背景/眨眼效果 -->
  <div
    ref="eyeRef"
    class="rounded-full flex items-center justify-center transition-all duration-150"
    :style="{
      width: `${size ?? 48}px`,
      height: isBlinking ? '2px' : `${size ?? 48}px`,
      backgroundColor: eyeColor ?? 'white',
      overflow: 'hidden',
    }"
  >
    <!-- 瞳孔：仅在非眨眼状态显示，动态计算位置 -->
    <div
      v-if="!isBlinking"
      class="rounded-full"
      :style="{
        width: `${pupilSize ?? 16}px`,
        height: `${pupilSize ?? 16}px`,
        backgroundColor: pupilColor ?? 'black',
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
        transition: 'transform 0.1s ease-out',
      }"
    ></div>
  </div>
</template>

<style scoped></style>
