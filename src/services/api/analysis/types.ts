export interface GetAppAnalysisResp {
  active_accounts: ActiveAccounts
  active_accounts_trend: Trend
  avg_of_conversation_messages: ActiveAccounts
  avg_of_conversation_messages_trend: Trend
  cost_consumption: ActiveAccounts
  cost_consumption_trend: Trend
  token_output_rate: ActiveAccounts
  total_messages: ActiveAccounts
  total_messages_trend: Trend
}

export interface ActiveAccounts {
  data: number
  pop: number
}

export interface Trend {
  x_axis: number[]
  y_axis: number[]
}
