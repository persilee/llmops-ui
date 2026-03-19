<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

// 定义Props类型
interface PupilProps {
  size?: number
  maxDistance?: number
  pupilColor?: string
  forceLookX?: number
  forceLookY?: number
}

// 声明Props并设置默认值
const props = withDefaults(defineProps<PupilProps>(), {
  size: 12,
  maxDistance: 5,
  pupilColor: 'black',
  forceLookX: undefined,
  forceLookY: undefined,
})
const mouseX = ref(0)
const mouseY = ref(0)
const pupilRef = ref<HTMLDivElement | null>(null)

const handleMouseMove = (e: MouseEvent) => {
  mouseX.value = e.clientX
  mouseY.value = e.clientY
}

const calculatePupilPosition = () => {
  if (!pupilRef.value) return { x: 0, y: 0 }

  // 优先使用强制注视方向（忽略鼠标）
  if (props.forceLookX !== undefined && props.forceLookY !== undefined) {
    return { x: props.forceLookX, y: props.forceLookY }
  }

  // 获取瞳孔容器的位置和中心坐标
  const pupil = pupilRef.value.getBoundingClientRect()
  const pupilCenterX = pupil.left + pupil.width / 2
  const pupilCenterY = pupil.top + pupil.height / 2

  // 计算鼠标与瞳孔中心的偏移量
  const deltaX = mouseX.value - pupilCenterX
  const deltaY = mouseY.value - pupilCenterY

  // 限制最大偏移距离（避免瞳孔超出眼球）
  const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), props.maxDistance)

  // 计算角度和最终偏移坐标
  const angle = Math.atan2(deltaY, deltaX)
  const x = Math.cos(angle) * distance
  const y = Math.sin(angle) * distance

  return { x, y }
}

const pupilPosition = computed(() => calculatePupilPosition())

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<template>
  <div
    ref="{pupilRef}"
    class="rounded-full"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: pupilColor,
      transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
      transition: 'transform 0.1s ease-out',
    }"
  ></div>
</template>

<style scoped></style>
