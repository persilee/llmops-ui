import { post, ssePost } from '@/services/request'
import type {
  GenerateConversationNameReq,
  GenerateConversationNameResp,
  GenerateSuggestedQuestionsReq,
  OptimizePromptReq,
} from './types'

class AIApi {
  /**
   * 优化提示词
   * @param req 优化提示词的请求参数
   * @param onData 接收服务器发送事件的回调函数
   * @returns 返回一个Promise对象，用于处理服务器发送事件
   */
  static optimizePrompt(
    req: OptimizePromptReq,
    onData: (event_response: Record<string, any>) => void,
  ) {
    return ssePost('/ai/optimize/prompt', { body: { ...req } }, onData)
  }

  /**
   * 生成建议问题
   * @param req 生成建议问题的请求参数
   * @returns 返回一个Promise对象，包含建议问题列表
   */
  static generateSuggestedQuestions(req: GenerateSuggestedQuestionsReq) {
    return post<Array<string>>({
      url: '/ai/suggested/questions',
      body: req,
    })
  }

  /**
   * 生成对话名称
   * @param req 生成对话名称的请求参数
   * @returns 返回一个Promise对象，包含生成的对话名称响应
   */
  static generateConversationName(req: GenerateConversationNameReq) {
    return post<GenerateConversationNameResp>({
      url: '/ai/generate-conversation-name',
      body: req,
    })
  }
}

export default AIApi
