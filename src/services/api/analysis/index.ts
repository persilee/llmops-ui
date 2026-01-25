import { get } from '@/services/request'
import type { GetAppAnalysisResp } from './types'

class AnalysisApi {
  /**
   * 获取应用分析数据
   * @param appId 应用ID
   * @returns 返回应用分析数据的Promise对象
   */
  static getAppAnalysis(appId: string) {
    return get<GetAppAnalysisResp>({
      url: `/app-analysis/${appId}`,
    })
  }
}

export default AnalysisApi
