import { get } from '@/services/request'
import type { GetBuiltinToolsResp, GetCategoriesResp } from './types'

class BuiltinToolApi {
  /**
   * 获取内置工具分类信息
   */
  static getCategories() {
    return get<Array<GetCategoriesResp>>({ url: '/builtin-tools/categories' })
  }

  static getBuiltinTools() {
    return get<Array<GetBuiltinToolsResp>>({ url: '/builtin-tools' })
  }
}

export default BuiltinToolApi
