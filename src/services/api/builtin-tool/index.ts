import { get } from '@/services/request'
import type { BaseResponse } from '@/services/types'
import type { GetBuiltinToolsResp, GetCategoriesResp, GetProviderToolResp } from './types'

class BuiltinToolApi {
  /**
   * 获取内置工具分类信息
   * @returns {Promise<BaseResponse<GetCategoriesResp[]>>} 返回内置工具分类信息的Promise对象
   */
  static getCategories() {
    return get<Array<GetCategoriesResp>>({ url: '/builtin-tools/categories' })
  }

  /**
   * 获取所有内置工具列表
   * @returns {Promise<BaseResponse<GetBuiltinToolsResp[]>>} 返回内置工具列表的Promise对象
   */
  static getBuiltinTools() {
    return get<Array<GetBuiltinToolsResp>>({ url: '/builtin-tools' })
  }

  /**
   * 获取指定提供商的工具信息
   * @param {string} providerName 提供商名称
   * @param {string} toolName 工具名称
   * @returns {Promise<BaseResponse<GetProviderToolResp>>} 返回工具信息的Promise对象
   */
  static getProviderTool(providerName: string, toolName: string) {
    return get<GetProviderToolResp>({
      url: `/builtin-tools/${providerName}/tools/${toolName}`,
    })
  }
}

export default BuiltinToolApi
