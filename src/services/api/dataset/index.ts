import { get, post } from '@/services/request'
import type { GetPagesParams } from '@/services/types'
import type {
  CreateDatasetReq,
  GetDatasetResp,
  GetDatasetsWithPageResp,
  UpdateDatasetReq,
} from './types'

class DatasetApi {
  /**
   * 获取分页的知识库列表
   * @param params - 分页参数，包含页码、每页数量等信息
   * @returns 返回一个Promise，解析为包含知识库列表和分页信息的响应对象
   */
  static getDatasetsWithPage(params: GetPagesParams) {
    return get<GetDatasetsWithPageResp, GetPagesParams>({
      url: '/datasets',
      params: params,
    })
  }

  /**
   * 获取指定ID的知识库详情
   * @param datasetId - 知识库的唯一标识符
   * @returns 返回一个Promise，解析为包含知识库详细信息的响应对象
   */
  static getDataset(datasetId: string) {
    return get<GetDatasetResp>({
      url: `/datasets/${datasetId}`,
    })
  }

  /**
   * 创建新的知识库
   * @param req - 创建知识库的请求参数，包含知识库的名称、描述等信息
   * @returns 返回一个Promise，解析为创建知识库的响应结果
   */
  static createDataset(req: CreateDatasetReq) {
    return post({
      url: `/datasets`,
      body: req,
    })
  }

  /**
   * 更新指定ID的知识库信息
   * @param datasetId - 知识库的唯一标识符
   * @param req - 更新知识库的请求参数，包含需要更新的字段信息
   * @returns 返回一个Promise，解析为更新知识库的响应结果
   */
  static updateDataset(datasetId: string, req: UpdateDatasetReq) {
    return post({
      url: `/datasets/${datasetId}`,
      body: req,
    })
  }

  /**
   * 删除指定ID的知识库
   * @param datasetId - 知识库的唯一标识符
   * @returns 返回一个Promise，解析为删除知识库的响应结果
   */
  static deleteDataset(datasetId: string) {
    return post({
      url: `/datasets/${datasetId}/delete`,
    })
  }
}

export default DatasetApi
