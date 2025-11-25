export interface UploadFileResp {
  account_id: string
  created_at: number
  extension: string
  id: string
  key: string
  mime_type: string
  name: string
  size: number
}

export interface UploadImageResp {
  url: string
}
