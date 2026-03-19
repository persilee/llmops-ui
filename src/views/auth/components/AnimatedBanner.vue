<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import EyeBall from './EyeBall.vue'
import EyePupil from './EyePupil.vue'

const props = defineProps<{
  isTyping?: boolean
  isPassword?: boolean
  showPassword?: boolean
}>()
const mouseX = ref(0)
const mouseY = ref(0)
const isLookingAtEachOther = ref(false)
const isPurplePeeking = ref(false)
const isPurpleBlinking = ref(false)
const isBlackBlinking = ref(false)
const purpleRef = ref<HTMLDivElement | null>(null)
const blackRef = ref<HTMLDivElement | null>(null)
const orangeRef = ref<HTMLDivElement | null>(null)
const yellowRef = ref<HTMLDivElement | null>(null)
let blinkTimeout: number | null = null
let blackBlinkTimeout: number | null = null
let lookTimer: number | null = null
let peekInterval: number | null = null
let peekDurationTimer: number | null = null

const handleMouseMove = (e: MouseEvent) => {
  mouseX.value = e.clientX
  mouseY.value = e.clientY
}

const calculatePosition = (ref: HTMLDivElement | null) => {
  if (!ref) return { faceX: 0, faceY: 0, bodyRotation: 0 }

  const rect = ref.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 3

  const deltaX = mouseX.value - centerX
  const deltaY = mouseY.value - centerY

  const faceX = Math.max(-15, Math.min(15, deltaX / 20))
  const faceY = Math.max(-10, Math.min(10, deltaY / 30))
  const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120))

  return { faceX, faceY, bodySkew }
}

const purplePos = computed(() => calculatePosition(purpleRef.value))
const blackPos = computed(() => calculatePosition(blackRef.value))
const orangePos = computed(() => calculatePosition(orangeRef.value))
const yellowPos = computed(() => calculatePosition(yellowRef.value))

// 生成随机眨眼间隔（3-7秒，和原逻辑一致）
const getRandomBlinkInterval = () => Math.random() * 4000 + 3000

// 递归调度眨眼动画（对应原scheduleBlink函数）
const scheduleBlink = () => {
  blinkTimeout = setTimeout(() => {
    // 开始眨眼（眼睛缩小）
    isPurpleBlinking.value = true

    // 150ms后结束眨眼（眼睛恢复），并递归调度下一次
    setTimeout(() => {
      isPurpleBlinking.value = false
      scheduleBlink()
    }, 150)
  }, getRandomBlinkInterval())
}

const scheduleBlackBlink = () => {
  blackBlinkTimeout = setTimeout(() => {
    // 开始眨眼（眼睛缩小）
    isBlackBlinking.value = true

    // 150ms后结束眨眼（眼睛恢复），并递归调度下一次
    setTimeout(() => {
      isBlackBlinking.value = false
      scheduleBlackBlink()
    }, 150)
  }, getRandomBlinkInterval())
}

const schedulePeek = () => {
  // 随机2-5秒触发偷看（和原逻辑一致：Math.random()*3000 + 2000）
  const randomDelay = Math.random() * 3000 + 2000

  const timer = setTimeout(() => {
    // 开始偷看
    isPurplePeeking.value = true

    // 800ms后结束偷看
    peekDurationTimer = setTimeout(() => {
      isPurplePeeking.value = false
      // 递归调度下一次偷看（原逻辑隐含的循环触发）
      if (props.isPassword && props.isPassword && props.showPassword) {
        schedulePeek()
      }
    }, 800)
  }, randomDelay)

  return timer
}

const stop = watch(
  () => props.isTyping,
  (newIsTyping) => {
    // 清除上一次的定时器（避免多个定时器叠加）
    if (lookTimer) {
      clearTimeout(lookTimer)
    }

    if (newIsTyping) {
      // 输入时：触发对视
      isLookingAtEachOther.value = true
      // 800ms后取消对视（恢复鼠标跟随）
      lookTimer = setTimeout(() => {
        isLookingAtEachOther.value = false
      }, 800)
    } else {
      // 未输入时：直接取消对视
      isLookingAtEachOther.value = false
    }
  },
  {
    immediate: true, // 可选：组件挂载时立即执行一次（和React useEffect一致）
    flush: 'sync', // 同步执行，确保状态及时更新
  },
)

watch(
  // 监听的依赖数组（和React一致）
  [() => props.isPassword, () => props.showPassword, () => isPurplePeeking.value],
  ([newPassword, newShowPassword]) => {
    // 先清理所有定时器（避免叠加）
    if (peekInterval) clearTimeout(peekInterval)
    if (peekDurationTimer) clearTimeout(peekDurationTimer)

    if (newPassword && newShowPassword) {
      // 密码有内容且显示 → 启动偷看调度
      peekInterval = schedulePeek()
    } else {
      // 无密码/密码隐藏 → 停止偷看
      isPurplePeeking.value = false
    }
  },
  {
    immediate: true, // 组件挂载时立即执行（和React useEffect一致）
    deep: false, // 基础类型无需深度监听
  },
)

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
  scheduleBlink()
  scheduleBlackBlink()
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  if (blinkTimeout) clearTimeout(blinkTimeout)
  if (blackBlinkTimeout) clearTimeout(blackBlinkTimeout)
  if (peekInterval) clearTimeout(peekInterval)
  if (peekDurationTimer) clearTimeout(peekDurationTimer)

  // 额外清理内层的150ms定时器（更严谨）
  const allTimeouts = setTimeout(() => {}, 0)
  for (let i = 0; i < allTimeouts; i++) {
    clearTimeout(i)
  }
  stop()
})
</script>

<template>
  <div
    class="w-full h-full flex items-center justify-center bg-gradient-to-tl from-[#00308F] to-[#1D2139]"
  >
    <div class="flex-1 h-full flex items-center justify-center">
      <div class="relative w-[min(500px,30vw)] h-[620px]">
        <!-- 紫色高矩形角色 -->
        <div
          ref="purpleRef"
          class="absolute bottom-0 transition-all duration-700 ease-in-out"
          :style="{
            left: '70px',
            width: '180px',
            height: isTyping || (isPassword && !showPassword) ? '560px' : '520px',
            backgroundColor: '#6C3FF5',
            borderRadius: '10px 10px 0 0',
            zIndex: 1,
            transform:
              isPassword && showPassword
                ? `skewX(0deg)`
                : isTyping || (isPassword && !showPassword)
                  ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)`
                  : `skewX(${purplePos.bodySkew || 0}deg)`,
            transformOrigin: 'bottom center',
          }"
        >
          <!-- 眼睛👀 -->
          <div
            class="absolute flex gap-8 transition-all duration-700 ease-in-out"
            :style="{
              left:
                isPassword && showPassword
                  ? `${20}px`
                  : isLookingAtEachOther
                    ? `${55}px`
                    : `${45 + purplePos.faceX}px`,
              top:
                isPassword && showPassword
                  ? `${35}px`
                  : isLookingAtEachOther
                    ? `${65}px`
                    : `${40 + purplePos.faceY}px`,
            }"
          >
            <EyeBall
              :size="18"
              :pupilSize="7"
              :maxDistance="5"
              eyeColor="white"
              pupilColor="#2D2D2D"
              :isBlinking="isPurpleBlinking"
              :forceLookX="
                isPassword && showPassword
                  ? isPurplePeeking
                    ? 4
                    : -4
                  : isLookingAtEachOther
                    ? 3
                    : undefined
              "
              :forceLookY="
                isPassword && showPassword
                  ? isPurplePeeking
                    ? 5
                    : -4
                  : isLookingAtEachOther
                    ? 4
                    : undefined
              "
            />
            <EyeBall
              :size="18"
              :pupilSize="7"
              :maxDistance="5"
              eyeColor="white"
              pupilColor="#2D2D2D"
              :isBlinking="isPurpleBlinking"
              :forceLookX="
                isPassword && showPassword
                  ? isPurplePeeking
                    ? 4
                    : -4
                  : isLookingAtEachOther
                    ? 3
                    : undefined
              "
              :forceLookY="
                isPassword && showPassword
                  ? isPurplePeeking
                    ? 5
                    : -4
                  : isLookingAtEachOther
                    ? 4
                    : undefined
              "
            />
          </div>
        </div>
        <!-- 黑色高矩形角色 -->
        <div
          ref="blackRef"
          class="absolute bottom-0 transition-all duration-700 ease-in-out"
          :style="{
            left: '240px',
            width: '120px',
            height: '390px',
            backgroundColor: '#2D2D2D',
            borderRadius: '8px 8px 0 0',
            zIndex: 2,
            transform:
              isPassword && showPassword
                ? `skewX(0deg)`
                : isLookingAtEachOther
                  ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                  : isTyping || (isPassword && !showPassword)
                    ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)`
                    : `skewX(${blackPos.bodySkew || 0}deg)`,
            transformOrigin: 'bottom center',
          }"
        >
          <div
            class="absolute flex gap-6 transition-all duration-700 ease-in-out"
            :style="{
              left:
                isPassword && showPassword
                  ? `${10}px`
                  : isLookingAtEachOther
                    ? `${32}px`
                    : `${26 + blackPos.faceX}px`,
              top:
                isPassword && showPassword
                  ? `${28}px`
                  : isLookingAtEachOther
                    ? `${12}px`
                    : `${32 + blackPos.faceY}px`,
            }"
          >
            <EyeBall
              :size="16"
              :pupilSize="6"
              :maxDistance="4"
              eyeColor="white"
              pupilColor="#2D2D2D"
              :isBlinking="isBlackBlinking"
              :forceLookX="isPassword && showPassword ? -4 : isLookingAtEachOther ? 0 : undefined"
              :forceLookY="isPassword && showPassword ? -4 : isLookingAtEachOther ? -4 : undefined"
            />
            <EyeBall
              :size="16"
              :pupilSize="6"
              :maxDistance="4"
              eyeColor="white"
              pupilColor="#2D2D2D"
              :isBlinking="isBlackBlinking"
              :forceLookX="isPassword && showPassword ? -4 : isLookingAtEachOther ? 0 : undefined"
              :forceLookY="isPassword && showPassword ? -4 : isLookingAtEachOther ? -4 : undefined"
            />
          </div>
        </div>
        <!-- 橙色半圆形角色 -->
        <div
          ref="orangeRef"
          class="absolute bottom-0 transition-all duration-700 ease-in-out"
          :style="{
            left: '0px',
            width: '240px',
            height: '230px',
            zIndex: 3,
            backgroundColor: '#FF9B6B',
            borderRadius: '120px 120px 0 0',
            transform:
              isPassword && showPassword ? `skewX(0deg)` : `skewX(${orangePos.bodySkew || 0}deg)`,
            transformOrigin: 'bottom center',
          }"
        >
          <!-- 眼睛👀 -->
          <div
            class="absolute flex gap-8 transition-all duration-200 ease-out"
            :style="{
              left: isPassword && showPassword ? `${50}px` : `${82 + (orangePos.faceX || 0)}px`,
              top: isPassword && showPassword ? `${85}px` : `${90 + (orangePos.faceY || 0)}px`,
            }"
          >
            <EyePupil
              :size="12"
              :maxDistance="5"
              pupilColor="#2D2D2D"
              :forceLookX="isPassword && showPassword ? -5 : undefined"
              :forceLookY="isPassword && showPassword ? -4 : undefined"
            />
            <EyePupil
              :size="12"
              :maxDistance="5"
              pupilColor="#2D2D2D"
              :forceLookX="isPassword && showPassword ? -5 : undefined"
              :forceLookY="isPassword && showPassword ? -4 : undefined"
            />
          </div>
        </div>
        <!-- 黄色矩形角色 -->
        <div
          ref="yellowRef"
          class="absolute bottom-0 transition-all duration-700 ease-in-out"
          :style="{
            left: '310px',
            width: '140px',
            height: '280px',
            backgroundColor: '#E8D754',
            borderRadius: '70px 70px 0 0',
            zIndex: 4,
            transform:
              isPassword && showPassword ? `skewX(0deg)` : `skewX(${yellowPos.bodySkew || 0}deg)`,
            transformOrigin: 'bottom center',
          }"
        >
          <!-- 眼睛👀 -->
          <div
            class="absolute flex gap-6 transition-all duration-200 ease-out"
            :style="{
              left: isPassword && showPassword ? `${20}px` : `${52 + (yellowPos.faceX || 0)}px`,
              top: isPassword && showPassword ? `${35}px` : `${40 + (yellowPos.faceY || 0)}px`,
            }"
          >
            <EyePupil
              :size="12"
              :maxDistance="5"
              pupilColor="#2D2D2D"
              :forceLookX="isPassword && showPassword ? -5 : undefined"
              :forceLookY="isPassword && showPassword ? -4 : undefined"
            />
            <EyePupil
              :size="12"
              :maxDistance="5"
              pupilColor="#2D2D2D"
              :forceLookX="isPassword && showPassword ? -5 : undefined"
              :forceLookY="isPassword && showPassword ? -4 : undefined"
            />
          </div>
          <!-- 嘴 -->
          <div
            :class="`absolute w-20 bg-[#2D2D2D] transition-all duration-300 ease-out ${isTyping ? 'smile-curve h-[6px]' : 'h-1'}`"
            :style="{
              left: isPassword && showPassword ? `${10}px` : `${40 + (yellowPos.faceX || 0)}px`,
              top: isPassword && showPassword ? `${88}px` : `${88 + (yellowPos.faceY || 0)}px`,
              /* 基础样式：确保初始是直线 */
              borderRadius: isTyping ? '50%' : '4px',
              transform: isTyping ? 'scaleX(1.1) skewY(-6deg) translateY(-2px) !important' : 'none',
            }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 核心：微笑弧度样式 */
.smile-curve {
  /* 关键：下半部分圆角拉满，形成向上弯的弧度 */
  border-radius: 0 0 100% 100% !important;
  /* 轻微倾斜+横向拉伸，增强微笑感 */
  transform: scaleX(1.1) skewY(-6deg) translateY(-2px) !important;
  /* 阴影增强立体感 */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
</style>
