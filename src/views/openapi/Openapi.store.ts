import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useOpenapiStore = defineStore('openapi', () => {
  const visible = ref(false)

  return {
    visible,
  }
})
