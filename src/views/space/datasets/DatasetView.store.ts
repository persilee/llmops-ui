import type { GetDocumentsWithPage } from '@/services/api/dataset/documents/type'
import type { GetDatasetsWithPage } from '@/services/api/dataset/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDatasetStore = defineStore(
  'dataset',
  () => {
    const dataset = ref<GetDatasetsWithPage>()
    const document = ref<GetDocumentsWithPage>()
    const currentStep = ref<number>(1)

    return {
      dataset,
      document,
      currentStep,
    }
  },
  {
    persist: true,
  },
)
