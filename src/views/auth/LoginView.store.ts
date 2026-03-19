import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLoginStore = defineStore('login', () => {
  const isTyping = ref(false)
  const isPassword = ref(false)
  const showPassword = ref(false)

  return {
    isTyping,
    isPassword,
    showPassword,
  }
})
