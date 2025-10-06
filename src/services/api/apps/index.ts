import { post } from '@/services/request'
import type { DebugAppResp } from './types'

class AppsApi {
  static debugApp({ appId, body }: { appId: string; body: any }) {
    return post<DebugAppResp>({ url: `/apps/${appId}/debug`, body: body })
  }
}

export default AppsApi
