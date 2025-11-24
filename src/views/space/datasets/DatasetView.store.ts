import type { GetDatasetsWithPage } from '@/services/api/dataset/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDatasetStore = defineStore(
  'dataset',
  () => {
    const dataset = ref<GetDatasetsWithPage>()
    const searchWord = ref<string>('')

    return {
      dataset,
      searchWord,
    }
  },
  {
    persist: true,
  },
)
