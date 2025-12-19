import { get, post } from '@/services/request'
import type { PaginatorParams } from '@/services/types'
import type {
  CreateSegmentReq,
  GetSegmentResp,
  GetSegmentsWithPageResp,
  UpdateSegmentEnabledReq,
  UpdateSegmentReq,
} from './types'

class SegmentsApi {
  /**
   * 分页获取文档片段列表
   * @param datasetId 知识库ID
   * @param documentId 文档ID
   * @param params 分页参数
   * @returns Promise<GetSegmentsWithPageResp[]> 片段列表响应
   */
  static getSegmentsWithPage(datasetId: string, documentId: string, params: PaginatorParams) {
    return get<GetSegmentsWithPageResp>({
      url: `/datasets/${datasetId}/documents/${documentId}/segments`,
      params,
    })
  }

  /**
   * 获取单个文档片段详情
   * @param datasetId 知识库ID
   * @param documentId 文档ID
   * @param segmentId 片段ID
   * @returns Promise<GetSegmentResp> 片段详情响应
   */
  static getSegment(datasetId: string, documentId: string, segmentId: string) {
    return get<GetSegmentResp>({
      url: `/datasets/${datasetId}/document/${documentId}/segment/${segmentId}`,
    })
  }

  /**
   * 更新文档片段的启用状态
   * @param datasetId 知识库ID
   * @param documentId 文档ID
   * @param segmentId 片段ID
   * @param req 更新启用状态的请求参数
   * @returns Promise<void>
   */
  static updateSegmentEnabled(
    datasetId: string,
    documentId: string,
    segmentId: string,
    req: UpdateSegmentEnabledReq,
  ) {
    return post({
      url: `/datasets/${datasetId}/document/${documentId}/segment/${segmentId}`,
      body: req,
    })
  }

  /**
   * 更新文档片段内容
   * @param datasetId 知识库ID
   * @param documentId 文档ID
   * @param segmentId 片段ID
   * @param req 更新片段的请求参数
   * @returns Promise<void>
   */
  static updateSegment(
    datasetId: string,
    documentId: string,
    segmentId: string,
    req: UpdateSegmentReq,
  ) {
    return post({
      url: `/datasets/${datasetId}/document/${documentId}/segment/${segmentId}/update`,
      body: req,
    })
  }

  /**
   * 创建新的文档片段
   * @param datasetId 知识库ID
   * @param documentId 文档ID
   * @param req 创建片段的请求参数
   * @returns Promise<void>
   */
  static createSegment(datasetId: string, documentId: string, req: CreateSegmentReq) {
    return post({
      url: `/datasets/${datasetId}/document/${documentId}/segment/create`,
      body: req,
    })
  }

  /**
   * 删除文档片段
   * @param datasetId 知识库ID
   * @param documentId 文档ID
   * @param segmentId 片段ID
   * @returns Promise<void>
   */
  static deleteSegment(datasetId: string, documentId: string, segmentId: string) {
    return post({
      url: `/datasets/${datasetId}/document/${documentId}/segment/${segmentId}/delete`,
    })
  }
}

export default SegmentsApi
