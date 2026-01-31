export interface GetPublishedConfigResp {
  web_app: WebApp
}

export interface WebApp {
  status: string
  token: string
}

export interface RegenerateWebAppTokenResp {
  token: string
}

export interface GetWebAppResp {
  app_config: AppConfig
  description: string
  icon: string
  id: string
  name: string
}

export interface AppConfig {
  features: string[]
  opening_questions: string[]
  opening_statement: string
  speech_to_text: SpeechToText
  suggested_after_answer: SpeechToText
  text_to_speech: TextToSpeech
}

export interface SpeechToText {
  enable: boolean
}

export interface TextToSpeech {
  auto_play: boolean
  enable: boolean
  voice: string
}

export interface WebAppChatReq {
  image_urls?: any[]
  query?: string
  conversation_id?: string
}

export interface GetConversationsResp {
  created_at: number
  id: string
  name: string
  summary: string
  is_pinned: boolean
}
