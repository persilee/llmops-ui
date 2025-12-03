<script setup lang="ts">
import imageBanner from '@/assets/images/image-banner.png'
const carousels = [
  {
    slogan: '开箱即用的高质量AI编排模板',
    subSlogan: '丰富的应用组件，覆盖大多数典型业务场景',
    image: imageBanner,
  },
  {
    slogan: '零代码 5 分钟编排原生 AI 应用',
    subSlogan: '高效开发你的 AI 应用',
    image: imageBanner,
  },
]
</script>

<template>
  <div
    class="w-[550px] flex items-center justify-center bg-gradient-to-tr from-[#1D2129] to-[#00308F]"
  >
    <div class="flex-1 h-full">
      <a-carousel animation-name="fade" class="h-full">
        <a-carousel-item v-for="carousel in carousels" :key="carousel.slogan">
          <div class="flex flex-col items-center justify-center h-full">
            <div class="text-2xl leading-7 font-bold text-gray-100">{{ carousel.slogan }}</div>
            <div class="mt-2 text-gray-400 leading-[22px]">{{ carousel.subSlogan }}</div>
            <img :src="carousel.image" class="w-[320px] mt-[30px]" />
          </div>
        </a-carousel-item>
      </a-carousel>
    </div>
  </div>
</template>

<style scoped></style>
