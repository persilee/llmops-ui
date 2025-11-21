import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSpaceStore = defineStore('space', () => {
  const searchWord = ref<string>('')
  const isOpenCreateToolModal = ref<boolean>(false)
  const isOpenEditToolModal = ref<boolean>(false)

  const openCreateToolModal = (isEdit: boolean = false) => {
    isOpenCreateToolModal.value = true
    isOpenEditToolModal.value = isEdit
  }

  const closeCreateToolModal = () => {
    isOpenCreateToolModal.value = false
  }

  const $reset = () => {
    searchWord.value = ''
  }

  return {
    searchWord,
    isOpenCreateToolModal,
    isOpenEditToolModal,
    openCreateToolModal,
    closeCreateToolModal,
    $reset,
  }
})
