export interface GetLLMModelResp {
  model: string
  label: string
  model_type: string
  features: string[]
  context_windows: number
  max_output_tokens: number
  attributes: Record<string, any>
  metadata: Record<string, any>
  parameters: {
    name: string
    label: string
    type: string
    help: string
    required: boolean
    default: any
    min: number
    max: number
    precision: number
    options: {
      label: string
      value: any
    }[]
  }[]
}
