<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'
import { post } from '@/utils/request'

const counterStore = useCounterStore()

const debug = () => {
  post('apps/debug', { query: '你好，你是？' })
}
</script>

<template>
  <div>Counter: {{ counterStore.count }}</div>
  <a-button type="primary" @click="counterStore.increment">Increment</a-button>
  <a-divider class="half-divider" />
  <a-button type="primary" @click="debug">你好？</a-button>
  <div>Home page</div>
</template>

<style scoped></style>
