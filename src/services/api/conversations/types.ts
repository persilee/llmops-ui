import type { BasePaginatorResponse } from '@/services/types'

export type GetConversationMessagesWithPageResp =
  BasePaginatorResponse<GetConversationMessagesWithPage>

export interface GetConversationMessagesWithPage {
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

export interface GetConversationNameResp {
  name: string
}

export interface UpdateConversationNameReq {
  name: string
}

export interface UpdateConversationIsPinnedReq {
  is_pinned: boolean
}
