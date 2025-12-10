import AppsApi from '@/services/api/apps'
import type { GetAppResp } from '@/services/api/apps/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore(
  'app',
  () => {
    const app = ref<GetAppResp>()

    const getApp = async (appId: string) => {
      const resp = await AppsApi.getApp(appId)
      app.value = resp.data
    }

    return {
      app,
      getApp,
    }
  },
  {
    persist: true,
  },
)
