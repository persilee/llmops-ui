import type { BasePaginatorResponse } from '@/services/types'

export type GetWorkflowsWithPageResp = BasePaginatorResponse<GetWorkflowsWithPage>
export interface GetWorkflowsWithPage {
  created_at?: number
  description?: string
  icon?: string
  id?: string
  is_debug_passed?: boolean
  name?: string
  node_count?: number
  published_at?: number
  status?: string
  tool_call_name?: string
  updated_at?: number
  draft_graph?: any
  graph?: any
}

export interface CreateWorkflowReq {
  description: string
  icon: string
  name: string
  tool_call_name: string
}

export interface CreateWorkflowResp {
  id: string
}

export interface GetWorkflowResp {
  created_at: number
  description: string
  icon: string
  id: string
  is_debug_passed: boolean
  name: string
  node_count: number
  published_at: number
  status: string
  tool_call_name: string
  updated_at: number
  draft_graph?: any
  graph?: any
}

export interface UpdateWorkflowReq {
  description: string
  icon: string
  name: string
  tool_call_name: string
}

export interface GetDraftGraphResp {
  edges: Edge[]
  nodes: Node[]
}

export interface Edge {
  id: string
  source: string
  source_type: string
  target: string
  target_type: string
}

export interface Node {
  description: string
  id: string
  inputs?: Input[]
  node_type: string
  position: Position
  title: string
  dataset_ids?: any[]
  meta?: NodeMeta
  outputs?: Output[]
  retrieval_config?: RetrievalConfig
  method?: string
  url?: string
  language_model_config?: LanguageModelConfig
  prompt?: string
  template?: string
  code?: string
}

export interface Input {
  description: string
  meta: InputMeta
  name: string
  required: boolean
  type: InputType
  value: InputValue
}

export interface InputMeta {
  type?: string
}

export enum InputType {
  Boolean = 'boolean',
  Int = 'int',
  String = 'string',
}

export interface InputValue {
  content: ContentClass | string
  type: ValueType
}

export interface ContentClass {
  ref_node_id: string
  ref_var_name: string
}

export enum ValueType {
  Generated = 'generated',
  Literal = 'literal',
  Ref = 'ref',
}

export interface LanguageModelConfig {
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

export interface NodeMeta {
  datasets: any[]
}

export interface Output {
  description: string
  meta: any
  name: string
  required: boolean
  type: InputType
  value: OutputValue
}

export interface OutputValue {
  content: ContentClass | number | null | string
  type: ValueType
}

export interface Position {
  x: number
  y: number
}

export interface RetrievalConfig {
  k: number
  retrieval_strategy: string
  score: number
}
