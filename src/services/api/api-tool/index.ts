import { get } from '@/services/request'
import type { GetAPIToolProvidersWithPageParams, GetAPIToolProvidersWithPageResp } from './types'

class APIToolsApi {
  /**
   * 分页获取API工具提供商列表
   * @param currentPage - 当前页码，可选参数
   * @param pageSize - 每页显示数量，可选参数
   * @param searchWord - 搜索关键词，可选参数
   * @returns 返回一个Promise，解析为GetAPIToolProvidersWithPageResp类型的数据
   */
  static getAPIToolProvidersWithPage(params?: GetAPIToolProvidersWithPageParams) {
    return get<GetAPIToolProvidersWithPageResp, GetAPIToolProvidersWithPageParams>({
      url: '/api-tools',
      params: {
        ...params,
      },
    })
  }
}

export default APIToolsApi
