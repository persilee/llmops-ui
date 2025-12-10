import type { BasePaginatorResponse } from '@/services/types'

export type DebugAppResp = {
  content: string
}

export interface DebugChatReq {
  image_urls?: any[]
  query: string
}

export interface CreateAppReq {
  description: string
  icon: string
  name: string
}

export interface CreateAppResp {
  id: string
}

export interface GetAppResp {
  created_at: number
  debug_conversation_id: string
  description: string
  draft_updated_at: number
  icon: string
  id: string
  name: string
  status: string
  updated_at: number
}

export interface UpdateAppReq {
  description: string
  icon: string
  name: string
}

export interface UpdateDebugConversationSummaryReq {
  summary: string
}

export interface GetDebugConversionSummaryReq {
  summary: string
}

export type GetDebugConversationMessagesWithPageResp =
  BasePaginatorResponse<GetDebugConversationMessagesWithPage>

export interface GetDebugConversationMessagesWithPage {
  agent_thoughts: AgentThought[]
  answer: string
  conversation_id: string
  created_at: number
  id: string
  image_urls: any[]
  latency: number
  query: string
  total_token_count: number
}

export interface AgentThought {
  created_at: number
  event: string
  id: string
  latency: number
  observation: string
  position: number
  thought: string
  tool: string
  tool_input: ToolInput
}

export interface ToolInput {
  query: string
}

export interface GetDraftAppConfigResp {
  created_at: number
  datasets: Dataset[]
  dialog_round: number
  id: string
  long_term_memory: LongTermMemory
  model_config: ModelConfig
  opening_questions: string[]
  opening_statement: string
  preset_prompt: string
  retrieval_config: RetrievalConfig
  review_config: ReviewConfig
  speech_to_text: LongTermMemory
  text_to_speech: TextToSpeech
  tools: ToolElement[]
  updated_at: number
  workflows: any[]
}

export interface Dataset {
  description?: string
  icon: string
  id: string
  name: string
  label?: string
}

export interface LongTermMemory {
  enable: boolean
}

export interface ModelConfig {
  model: string
  parameters: Parameters
  provider: string
}

export interface Parameters {
  frequency_penalty: number
  max_tokens: number
  presence_penalty: number
  temperature: number
  top_p: number
}

export interface RetrievalConfig {
  k: number
  retrieval_strategy: string
  score: number
}

export interface ReviewConfig {
  enable: boolean
  inputs_config: InputsConfig
  keywords: string[]
  outputs_config: LongTermMemory
}

export interface InputsConfig {
  enable: boolean
  preset_response: string
}

export interface TextToSpeech {
  auto_play: boolean
  enable: boolean
  voice: string
}

export interface ToolElement {
  provider: Dataset
  tool: ToolTool
  type: string
}

export interface ToolTool {
  description: string
  id: string
  label: string
  name: string
  params: Record<string, any>
}

export interface UpdateDraftAppConfigReq {
  datasets?: string[]
  dialog_round?: number
  long_term_memory?: LongTermMemory
  model_config?: ModelConfig
  opening_questions?: any[]
  opening_statement?: string
  preset_prompt?: string
  retrieval_config?: RetrievalConfig
  review_config?: ReviewConfig
  speech_to_text?: LongTermMemory
  text_to_speech?: TextToSpeech
  tools?: Tool[]
  workflows?: any[]
}

export interface LongTermMemory {
  enable: boolean
}

export interface ModelConfig {
  model: string
  parameters: Parameters
  provider: string
}

export interface Parameters {
  frequency_penalty: number
  max_tokens: number
  presence_penalty: number
  temperature: number
  top_p: number
}

export interface RetrievalConfig {
  k: number
  retrieval_strategy: string
  score: number
}

export interface ReviewConfig {
  enable: boolean
  inputs_config: InputsConfig
  keywords: string[]
  outputs_config: LongTermMemory
}

export interface InputsConfig {
  enable: boolean
  preset_response: string
}

export interface TextToSpeech {
  auto_play: boolean
  enable: boolean
  voice: string
}

export interface Tool {
  params: Record<string, any>
  provider_id: string
  tool_id: string
  type: string
}

export interface FallbackHistoryToDraftReq {
  app_config_version_id: string
}

export type GetPublishHistoriesWithPageResp = BasePaginatorResponse<GetPublishHistoriesWithPage>

export interface GetPublishHistoriesWithPage {
  created_at: number
  id: string
  version: number
}
