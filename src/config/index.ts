export const TIME_OUT = 100000

// export const BASE_URL = 'http://127.0.0.1:5000'
export const BASE_URL = '/api'

export const DEFAULT_ICON =
  'https://llmops-dev-1253877543.cos.ap-guangzhou.myqcloud.com/2025/11/26/d2d64088-edc7-471d-b987-071398f68f1b.png'

// 智能体事件类型
export const QueueEvent = {
  longTermMemoryRecall: 'long_term_memory_recall',
  agentThought: 'agent_thought',
  agentMessage: 'agent_message',
  agentAction: 'agent_action',
  datasetRetrieval: 'dataset_retrieval',
  agentEnd: 'agent_ent',
  stop: 'stop',
  error: 'error',
  timeout: 'timeout',
  ping: 'ping',
}

// 提取事件类型常量
export const RUNNING_THOUGHT_EVENTS = [
  QueueEvent.longTermMemoryRecall,
  QueueEvent.agentThought,
  QueueEvent.datasetRetrieval,
  QueueEvent.agentAction,
  QueueEvent.agentMessage,
] as const

export const thoughtNameMap = {
  [QueueEvent.longTermMemoryRecall]: '长期记忆召回',
  [QueueEvent.agentThought]: '智能体推理',
  [QueueEvent.datasetRetrieval]: '搜索知识库',
  [QueueEvent.agentAction]: '调用工具',
  [QueueEvent.agentMessage]: '智能体消息',
} as const

export const thoughtShortNameMap = {
  [QueueEvent.longTermMemoryRecall]: '长期记忆',
  [QueueEvent.agentThought]: '推理',
  [QueueEvent.datasetRetrieval]: '知识库',
  [QueueEvent.agentAction]: '工具',
  [QueueEvent.agentMessage]: '消息',
} as const
