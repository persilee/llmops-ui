import { upload } from '@/services/request'
import type { UploadFileResp, UploadImageResp } from './types'

class UploadApi {
  /**
   * 上传图片
   * @param image - 要上传的图片文件
   * @returns 返回上传结果，包含图片信息
   */
  static uploadImage(image: File) {
    const formData: FormData = new FormData()
    formData.append('file', image)

    return upload<UploadImageResp>('/upload-files/upload-image', { data: formData })
  }

  /**
   * 上传文件
   * @param file - 要上传的文件
   * @returns 返回上传结果，包含文件信息
   */
  static uploadFile(file: File, onProgress?: any) {
    const formData: FormData = new FormData()
    formData.append('file', file)

    return upload<UploadFileResp>('/upload-files/upload-file', { data: formData, onProgress })
  }
}

export default UploadApi
