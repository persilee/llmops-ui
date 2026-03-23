import { get, post } from '@/services/request'
import type { GetPayStatusResp, WechatPayReq, WechatPayResp } from './types'

class PayApi {
  static wechatPay(req: WechatPayReq) {
    return post<WechatPayResp>({ url: '/pay/wechat/pay', body: req })
  }

  static getPayStatus(orderNo: string) {
    return get<GetPayStatusResp>({ url: `/pay/${orderNo}/status` })
  }
}

export default PayApi
