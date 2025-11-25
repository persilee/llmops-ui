import { get, post } from '@/services/request'
import type { GetPagesParams } from '@/services/types'
import type {
  GetDocumentsWithPageResp,
  UpdateDocumentEnabledReq,
  UpdateDocumentNameReq,
} from './type'

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

  /**
   * 更新文档名称
   * @param datasetId 数据集ID
   * @param documentId 文档ID
   * @param req 更新文档名称的请求体，包含新的文档名称
   * @returns 返回一个Promise，解析为更新操作的响应结果
   */
  static updateDocumentName(datasetId: string, documentId: string, req: UpdateDocumentNameReq) {
    return post({
      url: `/datasets/${datasetId}/document/${documentId}/name`,
      body: req,
    })
  }

  /**
   * 删除文档
   * @param datasetId 数据集ID
   * @param documentId 文档ID
   * @returns 返回一个Promise，解析为删除操作的响应结果
   */
  static deleteDocument(datasetId: string, documentId: string) {
    return post({
      url: `/datasets/${datasetId}/document/${documentId}/delete`,
    })
  }

  /**
   * 更新文档启用状态
   * @param datasetId 数据集ID
   * @param documentId 文档ID
   * @param req 更新文档启用状态的请求体，包含启用状态信息
   * @returns 返回一个Promise，解析为更新操作的响应结果
   */
  static updateDocumentEnabled(
    datasetId: string,
    documentId: string,
    req: UpdateDocumentEnabledReq,
  ) {
    return post({
      url: `/datasets/${datasetId}/document/${documentId}/enabled`,
      body: req,
    })
  }
}

export default DocumentsApi
