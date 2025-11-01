import { get } from '@/services/request'
import type { BaseResponse } from '@/services/types'
import type { GetBuiltinToolsResp, GetCategoriesResp } from './types'

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
}

export default BuiltinToolApi
