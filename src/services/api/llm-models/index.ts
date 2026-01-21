import { get } from '@/services/request'
import type { GetLLMModelResp, GetLLMModelsResp } from './types'

class LLMModelApi {
  /**
   * 获取所有LLM模型列表
   * @returns 返回包含所有LLM模型信息的Promise对象
   */
  static getLLMModels() {
    return get<GetLLMModelsResp[]>({
      url: '/llm-models',
    })
  }

  /**
   * 获取指定提供商的LLM模型图标
   * @param providerName LLM模型提供商名称
   * @returns 返回包含模型图标数据的Promise对象
   */
  static getLLMModelIcon(providerName: string) {
    return get({
      url: `/llm-models/${providerName}/icon`,
    })
  }

  /**
   * 根据提供商名称和模型名称获取LLM模型详情
   * @param providerName LLM模型提供商名称
   * @param modelName LLM模型名称
   * @returns 返回包含LLM模型详细信息的Promise对象
   */
  static getLLMModel(providerName: string, modelName: string) {
    return get<GetLLMModelResp>({
      url: `/llm-models/${providerName}/${modelName}`,
    })
  }
}

export default LLMModelApi
