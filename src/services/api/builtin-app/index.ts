import { get, post } from '@/services/request'
import type {
  AddBuiltinAppToSpaceReq,
  AddBuiltinAppToSpaceResp,
  GetBuiltinAppCategoriesResp,
  GetBuiltinAppsResp,
} from './types'

class BuiltinAppApi {
  /**
   * 将内置应用添加到空间中
   * @param req 添加内置应用到空间的请求参数
   * @returns Promise对象，包含添加操作的响应结果
   */
  static addBuiltinAppToSpace(req: AddBuiltinAppToSpaceReq) {
    return post<AddBuiltinAppToSpaceResp>({
      url: '/builtin-apps/copy-to-space',
      body: req,
    })
  }

  /**
   * 获取内置应用列表
   * @returns Promise对象，包含内置应用列表的响应结果
   */
  static getBuiltinApps() {
    return get<GetBuiltinAppsResp[]>({
      url: '/builtin-apps/apps',
    })
  }

  /**
   * 获取内置应用分类列表
   * @returns Promise对象，包含内置应用分类列表的响应结果
   */
  static getBuiltinAppCategories() {
    return get<GetBuiltinAppCategoriesResp[]>({
      url: '/builtin-apps/categories',
    })
  }
}

export default BuiltinAppApi
