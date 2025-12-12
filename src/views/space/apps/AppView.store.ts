import AppsApi from '@/services/api/apps'
import type { GetAppResp, GetDraftAppConfigResp } from '@/services/api/apps/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore(
  'app',
  () => {
    const app = ref<GetAppResp>()
    const draftAppConfig = ref<GetDraftAppConfigResp>({
      id: '',
      created_at: 0,
      updated_at: 0,
      model_config: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        parameters: {
          temperature: 0.5,
          top_p: 0.85,
          frequency_penalty: 0.2,
          presence_penalty: 0.2,
          max_tokens: 8192,
        },
      },
      dialog_round: 3,
      preset_prompt: '',
      tools: [],
      workflows: [],
      datasets: [],
      retrieval_config: {
        retrieval_strategy: 'semantic',
        k: 10,
        score: 0.5,
      },
      long_term_memory: {
        enable: false,
      },
      opening_statement: '',
      opening_questions: [],
      speech_to_text: {
        enable: false,
      },
      text_to_speech: {
        enable: false,
        voice: 'echo',
        auto_play: false,
      },
      review_config: {
        enable: false,
        keywords: [],
        inputs_config: {
          enable: false,
          preset_response: '',
        },
        outputs_config: {
          enable: false,
        },
      },
    })

    const getApp = async (appId: string) => {
      const resp = await AppsApi.getApp(appId)
      app.value = resp.data
    }

    const getDraftAppConfig = async (appId: string) => {
      const resp = await AppsApi.getDraftAppConfig(appId)
      draftAppConfig.value = resp.data
    }

    return {
      app,
      draftAppConfig,
      getApp,
      getDraftAppConfig,
    }
  },
  {
    persist: true,
  },
)
