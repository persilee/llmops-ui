<script setup lang="ts">
import { post } from '@/services/request'
import { useCounterStore } from '@/stores/counter'

const counterStore = useCounterStore()

const debug = () => {
  post({ url: 'apps/debug', body: { query: '你好，你是？' } })
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
