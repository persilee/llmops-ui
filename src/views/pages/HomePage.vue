<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'
import { post } from '@/utils/request'

const counterStore = useCounterStore()

const debug = () => {
  post('apps/d7664ea4-4b0b-408d-b667-0504c11448eb/debug', {
    body: { query: '你好，你是？' },
  })
}
</script>

<template>
  <div>Counter: {{ counterStore.count }}</div>
  <a-button type="primary" @click="counterStore.increment">Increment</a-button>
  <a-button type="primary" @click="debug">你好？</a-button>
  <div>Home page</div>
</template>

<style scoped></style>
