<script setup lang="ts">
import { Fancybox } from '@fancyapps/ui/dist/fancybox/'
import '@fancyapps/ui/dist/fancybox/fancybox.css'
import { merge } from 'lodash-es'
import { onMounted, onUnmounted, onUpdated, ref } from 'vue'

const props = defineProps<{
  fancyboxOptions?: any
  imgSrc?: string
}>()
const containerRef = ref(null)
const defaultOptions = {
  Carousel: {
    Thumbs: {
      type: 'modern',
    },
    Toolbar: {
      display: {
        left: ['counter'],
        middle: ['zoomIn', 'zoomOut', 'toggle1to1'],
        right: ['download', 'thumbs', 'close'],
      },
    },
  },
}

const options = merge(defaultOptions, props.fancyboxOptions)

onMounted(() => {
  Fancybox.bind(containerRef.value, '[data-fancybox]', {
    ...(options || {}),
  })
})

onUpdated(() => {
  Fancybox.unbind(containerRef.value)

  Fancybox.close()

  Fancybox.bind(containerRef.value, '[data-fancybox]', {
    ...(options || {}),
  })
})

onUnmounted(() => {
  Fancybox.unbind(containerRef.value)
  Fancybox.close()
})
</script>

<template>
  <div ref="container" class="flex items-center gap-2">
    <slot>
      <a data-fancybox="gallery" :href="imgSrc" :data-thumb-src="imgSrc">
        <img
          :src="imgSrc"
          class="w-[248px] h-auto rounded-lg overflow-clip object-cover object-center"
          crossorigin="anonymous"
        />
      </a>
    </slot>
  </div>
</template>

<style scoped></style>
