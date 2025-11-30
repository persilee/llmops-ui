import { get, post } from '@/services/request'
import type { GetPagesParams } from '@/services/types'
import type {
  CreateDocumentReq,
  CreateDocumentResp,
  DatasetHitReq,
  DatasetHitResp,
  GetDatasetQueriesResp,
  GetDocumentResp,
  GetDocumentsStatusResp,
  GetDocumentsWithPageResp,
  UpdateDocumentEnabledReq,
  UpdateDocumentNameReq,
} from './type'

class DocumentsApi {
  /**
   * 获取知识库的分页文档列表
   * @param datasetId 知识库ID
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
   * @param datasetId 知识库ID
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
   * @param datasetId 知识库ID
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
   * @param datasetId 知识库ID
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

  /**
   * 向知识库发起查询请求
   * @param datasetId 知识库ID
   * @param req 查询请求体，包含查询相关的参数
   * @returns 返回一个Promise，解析为查询结果数组
   */
  static hitDataset(datasetId: string, req: DatasetHitReq) {
    return post<Array<DatasetHitResp>>({
      url: `/datasets/${datasetId}/hit`,
      body: req,
    })
  }

  /**
   * 获取知识库的查询记录
   * @param datasetId 知识库ID
   * @returns 返回一个Promise，解析为查询记录数组
   */
  static getDatasetQueries(datasetId: string) {
    return get<Array<GetDatasetQueriesResp>>({
      url: `/datasets/${datasetId}/get_dataset_queries`,
    })
  }

  /**
   * 创建新文档
   * @param datasetId 知识库ID
   * @param req 创建文档的请求体，包含文档相关信息
   * @returns 返回一个Promise，解析为创建操作的响应结果
   */
  static createDocument(datasetId: string, req: CreateDocumentReq) {
    return post<CreateDocumentResp>({
      url: `/datasets/${datasetId}/documents`,
      body: req,
    })
  }

  /**
   * 获取文档状态
   * @param datasetId 知识库ID
   * @param batch 批次ID
   * @returns 返回一个Promise，解析为文档状态数组
   */
  static getDocumentsStatus(datasetId: string, batch: string) {
    return post<Array<GetDocumentsStatusResp>>({
      url: `/datasets/${datasetId}/documents/batch/${batch}`,
    })
  }

  /**
   * 获取文档详情
   * @param datasetId 知识库ID
   * @param documentId 文档ID
   * @returns 返回一个Promise，解析为文档详情对象
   */
  static getDocument(datasetId: string, documentId: string) {
    return get<GetDocumentResp>({
      url: `/datasets/${datasetId}/document/${documentId}`,
    })
  }
}

export default DocumentsApi
