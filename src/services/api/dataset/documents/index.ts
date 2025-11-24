import { get } from '@/services/request'
import type { GetPagesParams } from '@/services/types'
import type { GetDocumentsWithPageResp } from './type'

class DocumentsApi {
  /**
   * 获取数据集的分页文档列表
   * @param datasetId 数据集ID
   * @param params 分页参数，包含页码、每页数量等信息
   * @returns 返回一个Promise，解析为包含文档列表和分页信息的响应对象
   */
  static getDocumentsWithPage(datasetId: string, params: GetPagesParams) {
    return get<GetDocumentsWithPageResp>({
      url: `/datasets/${datasetId}/documents`,
      params,
    })
  }
}

export default DocumentsApi
