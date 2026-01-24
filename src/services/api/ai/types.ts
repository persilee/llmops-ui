export interface OptimizePromptReq {
  prompt: string
}

export interface GenerateSuggestedQuestionsReq {
  message_id: string
}

export interface GenerateConversationNameReq {
  query: string
}

export interface GenerateConversationNameResp {
  name: string
}
