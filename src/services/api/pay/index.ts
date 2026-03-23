import { post } from '@/services/request'
import type { WechatPayReq, WechatPayResp } from './types'

class PayApi {
  static wechatPay(req: WechatPayReq) {
    return post<WechatPayResp>({ url: '/pay/wechat/pay', body: req })
  }
}

export default PayApi
