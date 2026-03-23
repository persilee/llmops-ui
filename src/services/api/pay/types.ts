export interface WechatPayReq {
  total_fee: string
}

export interface WechatPayResp {
  trade_no: string
  wechat_pay_url: string
}

export interface GetPayStatusResp {
  pay_status: string
}
