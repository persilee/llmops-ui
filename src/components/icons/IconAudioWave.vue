<template>
  <div class="audio-wave" :class="{ 'is-playing': isPlaying }">
    <span class="bar"></span>
    <span class="bar"></span>
    <span class="bar"></span>
    <span class="bar"></span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  isPlaying?: boolean
}>()
</script>

<style scoped>
.audio-wave {
  display: flex;
  align-items: center;
  gap: 1.5px;
  height: 10px;
}

.bar {
  width: 1.5px;
  height: 4px;
  background-color: #155dfc;
  border-radius: 2px;
  transition: all 0.2s ease;
}

/* 播放状态下的动画 */
.is-playing .bar:nth-child(1) {
  animation: wave 0.8s ease-in-out infinite;
}
.is-playing .bar:nth-child(2) {
  animation: wave 0.6s ease-in-out infinite;
  animation-delay: 0.2s;
}
.is-playing .bar:nth-child(3) {
  animation: wave 0.9s ease-in-out infinite;
  animation-delay: 0.4s;
}

.is-playing .bar:nth-child(4) {
  animation: wave 1s ease-in-out infinite;
  animation-delay: 0.8s;
}

@keyframes wave {
  0%,
  100% {
    height: 6px;
  }
  50% {
    height: 10px;
  }
}
</style>
