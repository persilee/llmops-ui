import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useSpaceStore = defineStore(
  'space',
  () => {
    const searchWord = ref<string>('')
    const isOpenCreateToolModal = ref<boolean>(false)
    const isOpenEditToolModal = ref<boolean>(false)
    const isOpenCreateDatasetModal = ref<boolean>(false)
    const isOpenEditDatasetModal = ref<boolean>(false)

    const openCreateToolModal = (isEdit: boolean = false) => {
      isOpenCreateToolModal.value = true
      isOpenEditToolModal.value = isEdit
    }

    const closeCreateToolModal = () => {
      isOpenCreateToolModal.value = false
    }

    const openDatasetModal = computed({
      get: () => isOpenCreateDatasetModal.value || isOpenEditDatasetModal.value,
      set: (value: boolean) => {
        isOpenCreateDatasetModal.value = value
        isOpenEditDatasetModal.value = value
      },
    })

    const openCreateDatasetModal = () => {
      isOpenCreateDatasetModal.value = true
      isOpenEditDatasetModal.value = false
    }

    const openEditDatasetModal = () => {
      isOpenEditDatasetModal.value = true
      isOpenCreateDatasetModal.value = false
    }

    const closeCreateDatasetModal = () => {
      isOpenCreateDatasetModal.value = false
    }

    const $reset = () => {
      searchWord.value = ''
      isOpenCreateToolModal.value = false
      isOpenCreateDatasetModal.value = false
      isOpenEditDatasetModal.value = false
      isOpenEditToolModal.value = false
    }

    return {
      searchWord,
      isOpenCreateToolModal,
      isOpenEditToolModal,
      openCreateToolModal,
      closeCreateToolModal,
      isOpenCreateDatasetModal,
      isOpenEditDatasetModal,
      openDatasetModal,
      openCreateDatasetModal,
      closeCreateDatasetModal,
      openEditDatasetModal,
      $reset,
    }
  },
  {
    persist: true,
  },
)
