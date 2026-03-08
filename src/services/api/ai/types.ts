export interface OptimizePromptReq {
  prompt: string
  app_id?: string
}

export interface GenerateSuggestedQuestionsReq {
  message_id: string
}

export interface GenerateConversationNameReq {
  query: string
  app_id?: string
}

export interface GenerateConversationNameResp {
  name: string
}
