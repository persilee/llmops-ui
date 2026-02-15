import { BASE_URL } from '@/config'
import { post, ssePost, upload } from '@/services/request'
import { useCredentialStore } from '@/stores/credential'
import type { AudioToTextResp, MessageToAudioResp } from './types'

class AudioApi {
  /**
   * 将音频文件转换为文本
   * @param file 要转换的音频文件，以Blob格式传入
   * @param extension 音频文件的扩展名（如：mp3、wav等）
   * @returns 返回一个Promise，解析为AudioToTextResp类型的响应数据
   */
  static audioToText(file: Blob, extension: string) {
    const formData = new FormData()
    formData.append('file', file, `${new Date().getTime()}.${extension}`)

    return upload<AudioToTextResp>('/audio/text', { data: formData })
  }

  /**
   * 通过 SSE (Server-Sent Events) 方式将消息转换为音频
   * @param messageId 要转换的消息ID
   * @param onData SSE 事件回调函数，接收服务器推送的音频数据
   * @returns 返回 SSE 连接对象，可用于关闭连接
   */
  static messageToAudioSSE(
    messageId: string,
    onData: (event_response: { [key: string]: any }) => void,
  ) {
    return ssePost('/audio', { body: { message_id: messageId } }, onData)
  }

  /**
   * 将消息转换为音频
   * @param messageId 要转换的消息ID
   * @returns 返回一个Promise，解析为音频数据
   */
  static async messageToAudio(messageId: string) {
    return post<MessageToAudioResp>({
      url: '/audio/tts',
      body: { message_id: messageId },
    })
  }

  /**
   * 将文本转换为音频
   * @param text 要转换的文本内容
   * @param voice 语音类型，使用数字标识不同的语音风格
   * @returns 返回一个Promise，解析为音频数据的Response对象
   */
  static async textToAudio(text: string, voice: number) {
    const store = useCredentialStore()
    const token = store.credential?.access_token
    return await fetch(`${BASE_URL}/audio/tts/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text: text,
        voice: voice,
      }),
    })
  }
}

export default AudioApi
