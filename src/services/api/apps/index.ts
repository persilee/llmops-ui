import { ssePost } from '@/services/request'

class AppsApi {
  static debugApp({
    appId,
    body,
    onData,
  }: {
    appId: string
    body: any
    onData: (event_response: { [key: string]: any }) => void
  }) {
    return ssePost(`/apps/${appId}/debug`, { body }, onData)
  }
}

export default AppsApi
