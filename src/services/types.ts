export type BaseResponse<T> = {
  code: string
  message: string
  data: T
}

export type BasePaginatorResponse<T> = {
  list: Array<T>
  paginator: Paginator
}

export type Paginator = {
  current_page: number
  page_size: number
  total_page: number
  total_record: number
}
