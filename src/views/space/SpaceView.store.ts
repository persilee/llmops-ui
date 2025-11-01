import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToolProviderStore = defineStore('toolProvider', () => {
  const searchWord = ref<string>('')

  return {
    searchWord,
  }
})
