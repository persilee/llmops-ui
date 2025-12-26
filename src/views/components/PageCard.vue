<script setup lang="ts">
defineProps<{
  icon: string
  background: string
  name: string
  subLabel: string
  description: string
  date: string
}>()
</script>

<template>
  <a-card class="cursor-pointer rounded-lg" hoverable>
    <div class="flex flex-row items-center gap-3 mb-3">
      <a-image
        class="w-10 h-10 rounded-lg"
        fit="cover"
        :preview-visible="false"
        :src="icon"
        :style="{ background: background }"
      />
      <div class="flex flex-col">
        <div class="text-base text-gray-900 font-bold line-clamp-1">{{ name }}</div>
        <div class="text-xs text-gray-500 line-clamp-1">
          {{ subLabel }}
        </div>
      </div>
      <div class="ml-auto"><slot></slot></div>
    </div>
    <div class="leading-[18px] text-gray-500 h-[72px] line-clamp-4 mb-2">
      {{ description }}
    </div>
    <div class="flex items-center gap-1.5">
      <div class="w-4 h-4 flex items-center justify-center rounded-full bg-blue-700">
        <img src="@/assets/images/icon-user.png" class="w-2 h-2" />
      </div>
      <div class="text-xs text-gray-400 line-clamp-1">
        {{ date }}
      </div>
    </div>
  </a-card>
</template>

<style scoped></style>
