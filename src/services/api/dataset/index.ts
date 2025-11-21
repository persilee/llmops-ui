import { get } from '@/services/request'
import type { GetPagesParams } from '@/services/types'
import type { GetDatasetsWithPageResp } from './types'

class DatasetApi {
  /**
   * 获取分页的数据集列表
   * @param params - 分页参数，包含页码、每页数量等信息
   * @returns 返回一个Promise，解析为包含数据集列表和分页信息的响应对象
   */
  static getDatasetsWithPage(params: GetPagesParams) {
    return get<GetDatasetsWithPageResp, GetPagesParams>({
      url: '/datasets',
      params: params,
    })
  }
}

export default DatasetApi
