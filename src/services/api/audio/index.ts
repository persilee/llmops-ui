import { upload } from '@/services/request'
import type { AudioToTextResp } from './types'

class AudioApi {
  static audioToText(file: Blob, extension: string) {
    const formData = new FormData()
    formData.append('file', file, `${new Date().getTime()}.${extension}`)

    return upload<AudioToTextResp>('/audio/text', { data: formData })
  }
}

export default AudioApi
