import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToolProviderStore = defineStore('toolProvider', () => {
  const searchWord = ref<string>('')

  const $reset = () => {
    searchWord.value = ''
  }

  return {
    searchWord,
    $reset,
  }
})
