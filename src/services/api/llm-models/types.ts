export interface GetLLMModelsResp {
  background: string
  description: string
  icon: string
  label: string
  models: Model[]
  name: string
  position: number
  support_model_types: string[]
}

export interface Model {
  attributes: Attributes
  context_window: number
  features: string[]
  label: string
  description: string
  max_output_tokens: number
  metadata: Metadata
  model_name: string
  model_type: string
  parameters: Parameter[]
}

export interface Attributes {
  model: string
}

export interface GetLLMModelResp {
  attributes: Attributes
  context_window: number
  features: string[]
  label: string
  max_output_tokens: number
  metadata: Metadata
  model_name: string
  model_type: string
  parameters: Parameter[]
}

export interface Attributes {
  model: string
}

export interface Metadata {
  pricing: Pricing
}

export interface Pricing {
  currency: string
  input: number
  output: number
  unit: number
}

export interface Parameter {
  default: number
  help: string
  label: string
  max: number
  min: number
  name: string
  options: any[]
  precision: number
  required: boolean
  type: string
}

export interface Metadata {
  pricing: Pricing
}

export interface Pricing {
  currency: string
  input: number
  output: number
  unit: number
}

export interface Parameter {
  default: number
  help: string
  label: string
  max: number
  min: number
  name: string
  options: any[]
  precision: number
  required: boolean
  type: string
}

export interface ModelConfig {
  model?: string
  parameters?: Parameters
  provider?: string
}

export interface Parameters {
  frequency_penalty: number
  max_tokens: number
  presence_penalty: number
  temperature: number
  top_p: number
}
