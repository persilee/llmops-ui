import AppsApi from '@/services/api/apps'
import type {
  GetAppResp,
  GetDraftAppConfigResp,
  Tool,
  UpdateDraftAppConfigReq,
} from '@/services/api/apps/types'
import { Message } from '@arco-design/web-vue'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore(
  'app',
  () => {
    const loading = ref(false)
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
      suggested_after_answer: {
        enable: true,
      },
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

    /**
     * 获取应用信息
     * @param {string} appId - 应用的唯一标识符
     * @returns {Promise<void>} 返回一个Promise，表示获取操作的完成
     * @description
     * 该方法用于获取指定应用的详细信息，执行以下操作：
     * 1. 接收应用ID作为参数
     * 2. 调用AppsApi.getApp方法获取应用数据
     * 3. 将获取到的应用数据存储到app响应式变量中
     * @throws {Error} 当获取应用信息失败时抛出错误
     */
    const getApp = async (appId: string) => {
      const resp = await AppsApi.getApp(appId)
      app.value = resp.data
    }

    /**
     * 获取应用的草稿配置
     * @description
     * 该方法用于获取当前应用的草稿配置信息，执行以下操作：
     * 1. 检查应用是否存在且具有有效的ID
     * 2. 调用API获取草稿配置
     * 3. 将获取到的配置数据存储到draftAppConfig中
     * @returns {Promise<void>} 返回一个Promise，表示获取操作的完成
     * @throws {Error} 当获取配置失败时抛出错误
     */
    const getDraftAppConfig = async () => {
      if (app.value && app.value.id) {
        const resp = await AppsApi.getDraftAppConfig(app.value.id)
        draftAppConfig.value = resp.data
      }
    }

    /**
     * 更新应用的草稿配置
     * @param {UpdateDraftAppConfigReq} req - 更新草稿配置的请求参数，包含需要更新的配置信息
     * @returns {Promise<any>} 返回一个Promise，包含更新操作的响应结果
     * @throws {Error} 当更新操作失败时抛出错误
     * @description
     * 该方法用于更新应用的草稿配置，执行以下操作：
     * 1. 验证应用ID是否存在
     * 2. 设置加载状态为true
     * 3. 调用API更新配置
     * 4. 重新获取更新后的配置
     * 5. 无论成功失败都会重置加载状态
     */
    const updateDraftAppConfig = async (req: UpdateDraftAppConfigReq) => {
      if (!app.value?.id) {
        return
      }

      try {
        loading.value = true
        const resp = await AppsApi.updateDraftAppConfig(app.value.id, req)
        await getDraftAppConfig()
        return resp
      } catch (error) {
        throw error
      } finally {
        loading.value = false
      }
    }

    /**
     * 获取当前应用配置中已存在的工具列表
     * @returns {Tool[]} 返回转换后的工具列表，每个工具包含以下字段：
     *   - params: 工具的参数配置
     *   - provider_id: 工具提供者的ID
     *   - tool_id: 工具的ID
     *   - type: 工具的类型
     */
    const getExistingTools = (): Tool[] => {
      return draftAppConfig.value.tools.map(({ provider, tool, type }) => ({
        params: tool.params,
        provider_id: provider.id,
        tool_id: tool.id,
        type,
      }))
    }

    /**
     * 移除指定的工具
     * @param {string} providerId - 要移除的工具id
     * @returns {Promise<void>} 返回一个Promise，表示移除操作的完成
     * @throws {Error} 当移除工具失败时抛出错误
     */
    const removeTool = async (providerId: string) => {
      try {
        // 开始加载，显示加载动画
        loading.value = true

        // 通过比较 provider.id 来确定要移除的工具
        const filteredTools = draftAppConfig.value.tools.filter(
          (item) => item.provider.id !== providerId,
        )

        // 将过滤后的工具数组转换为后端API所需的请求格式
        // 解构出需要的字段并重新组织数据结构
        const toolsReq = filteredTools.map(({ provider, tool, type }) => {
          return {
            // 工具参数配置
            params: tool.params,
            // 提供者ID
            provider_id: provider.id,
            // 工具ID
            tool_id: tool.id,
            // 工具类型
            type,
          }
        })

        // 调用store的方法更新应用配置
        // 传入处理后的工具请求数据
        await updateDraftAppConfig({ tools: toolsReq })

        Message.success('移除扩展插件成功')
      } catch (error) {
        // 错误处理：捕获并记录移除过程中可能发生的错误
        // 可以根据需要添加更多的错误处理逻辑，如显示错误提示
      } finally {
        // 无论操作成功还是失败，最后都将加载状态设置为false
        // 确保加载动画总是会被关闭，提升用户体验
        loading.value = false
      }
    }

    return {
      app,
      draftAppConfig,
      loading,
      getApp,
      getDraftAppConfig,
      updateDraftAppConfig,
      getExistingTools,
      removeTool,
    }
  },
  {
    persist: true,
  },
)
